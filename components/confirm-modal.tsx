import { useEffect, useRef } from "react";
import { UiIcon } from "./ui-icon";

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Delete",
  cancelText = "Cancel"
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} className="confirm-modal" onClose={onCancel}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-icon-bg">
            <UiIcon name="delete" width={24} height={24} />
          </div>
          <h3>{title}</h3>
        </div>
        <p className="modal-body">{message}</p>
        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
}
