import { Component, type ReactNode } from 'react'
import type { ProblemSink } from '../../core/ports'

interface Props {
  shiftId: string
  kind: string
  problems?: ProblemSink
  /** what was being drawn: when it changes (new content, another language) the ticket gets another try */
  subject: unknown
  children: ReactNode
}

/**
 * A ticket whose view throws while drawing is left out and reported — like a
 * record that fails in the pipeline (`failed`). One broken ticket must not take
 * the page down. (React needs a class for this.)
 *
 * The page's "N shifts could not be shown" line counts faulty RECORDS; a view
 * that throws is a defect in the code and is only reported here.
 */
export class TicketBoundary extends Component<Props, { failed: boolean; subject: unknown }> {
  state = { failed: false, subject: this.props.subject }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  static getDerivedStateFromProps(props: Props, state: { failed: boolean; subject: unknown }) {
    return props.subject === state.subject ? null : { failed: false, subject: props.subject }
  }

  componentDidCatch(error: unknown) {
    const { shiftId, kind, problems } = this.props
    problems?.report([{ shiftId, kind, code: 'failed', severity: 'error', detail: error instanceof Error ? error.message : String(error) }])
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
