import { NextResponse } from 'next/server'

import { runQA } from '@/lib/qa/checker'
import { submitToGatekeeper } from '@/lib/semantic-gate/gatekeeper'
import { ProposalSchema } from '@/lib/schemas/proposal.schema'
import { writeRule } from '@/lib/writer/single-writer'

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Step 1: QA
  const qaResult = runQA(body)

  if (!qaResult.pass) {
    return NextResponse.json(
      {
        stage: 'qa',
        qa: qaResult,
        gatekeeper: null,
        writer: null,
        message: 'QA falhou. Proposta não enviada ao gatekeeper.'
      },
      { status: 422 }
    )
  }

  // Parse validated proposal
  const parsed = ProposalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Schema inválido', details: parsed.error.issues }, { status: 400 })
  }

  const proposal = parsed.data

  // Step 2: Gatekeeper
  const gatekeeperDecision = await submitToGatekeeper(proposal, qaResult)

  if (gatekeeperDecision.decision !== 'approved') {
    return NextResponse.json(
      {
        stage: 'gatekeeper',
        qa: qaResult,
        gatekeeper: gatekeeperDecision,
        writer: null,
        message: `Gatekeeper: ${gatekeeperDecision.decision}. Proposta não escrita no banco.`
      },
      { status: gatekeeperDecision.decision === 'rework' ? 202 : 422 }
    )
  }

  // Step 3: Writer
  const writeResult = await writeRule(proposal, gatekeeperDecision)

  if (!writeResult.success) {
    return NextResponse.json(
      {
        stage: 'writer',
        qa: qaResult,
        gatekeeper: gatekeeperDecision,
        writer: writeResult,
        message: `Erro na escrita: ${writeResult.error}`
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      stage: 'done',
      qa: qaResult,
      gatekeeper: gatekeeperDecision,
      writer: writeResult,
      message: 'Proposta aprovada e escrita com sucesso.'
    },
    { status: 201 }
  )
}
