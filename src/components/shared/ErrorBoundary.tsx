import { Component, type ErrorInfo, type ReactNode } from "react";
import { audioManager } from "../../utils/audio-manager";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { logger } from "../../utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.bug("React Rendering Exception", error, {
      componentStack: errorInfo.componentStack || "",
    });
  }

  private handleReload = () => {
    try {
      audioManager.playButtonSfx();
    } catch {
      // Ignore audio context errors if it hasn't started
    }
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "#36c8df",
            fontFamily: '"Be Vietnam Pro", sans-serif',
            padding: "20px",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "min(100% - 32px, 360px)",
              background: "#fdf6ea",
              border: "3px solid #2a2418",
              borderRadius: "24px",
              padding: "32px 24px",
              textAlign: "center",
              boxShadow: "0 16px 0 rgba(42, 36, 24, 0.15)",
              color: "#2a2418",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(232, 116, 50, 0.12)",
                color: "#e87432",
                marginBottom: "20px",
                border: "2px solid rgba(232, 116, 50, 0.25)",
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "24px",
                fontWeight: 900,
                color: "#2a2418",
              }}
            >
              Đã xảy ra sự cố
            </h2>

            <p
              style={{
                margin: "0 0 24px",
                fontSize: "14px",
                lineHeight: "1.5",
                color: "#8a7d65",
              }}
            >
              Trò chơi gặp lỗi bất ngờ trong quá trình hoạt động. Hãy thử tải lại trang.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: "rgba(42, 36, 24, 0.05)",
                  border: "1px solid rgba(42, 36, 24, 0.1)",
                  borderRadius: "12px",
                  padding: "10px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  textAlign: "left",
                  wordBreak: "break-all",
                  maxHeight: "80px",
                  overflowY: "auto",
                  color: "#e87432",
                  marginBottom: "24px",
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "#e87432",
                color: "#fdf6ea",
                border: "2px solid #2a2418",
                borderRadius: "16px",
                padding: "14px 20px",
                fontSize: "15px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 0 #2a2418",
                transition: "all 0.1s ease",
              }}
            >
              <RotateCcw size={16} />
              Tải lại trò chơi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
