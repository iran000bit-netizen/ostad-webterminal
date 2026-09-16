import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <div className="chart-fallback">Chart unavailable</div>
    ) : (
      this.props.children
    );
  }
}
