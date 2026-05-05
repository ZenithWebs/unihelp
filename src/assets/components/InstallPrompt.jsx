import { useEffect, useState } from "react";

let deferredPrompt;

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt = e;

      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("App installed");
    }

    deferredPrompt = null;
    setShow(false);
  };

  const closeModal = () => {
    setShow(false);
    const dismissedTime = localStorage.getItem("install-dismissed");
    if (dismissedTime && Date.now() - dismissedTime < 86400000) {
      return null;
    }
  };

  // Don't show if dismissed before
  if (localStorage.getItem("install-dismissed")) return null;

  if (!show) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Install CampusFlow</h2>
        <p style={styles.text}>
          Get a faster, app-like experience. Install CampusFlow on your device.
        </p>

        <div style={styles.buttons}>
          <button style={styles.installBtn} onClick={installApp}>
            Install
          </button>
          <button style={styles.cancelBtn} onClick={closeModal}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    width: "100%",
    maxWidth: "400px",
    background: "#fff",
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px",
    padding: "20px",
    boxShadow: "0 -5px 20px rgba(0,0,0,0.2)",
    animation: "slideUp 0.3s ease",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
  },
  text: {
    margin: "10px 0 20px",
    color: "#555",
  },
  buttons: {
    display: "flex",
    gap: "10px",
  },
  installBtn: {
    flex: 1,
    padding: "12px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    background: "#eee",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
};