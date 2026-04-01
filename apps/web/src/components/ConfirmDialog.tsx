import React from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isDangerous = true
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onCancel}
      ></div>
      
      <div className="bg-surface-container-high border border-white/5 rounded-2xl p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDangerous ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
            <span className="material-symbols-outlined text-2xl">
              {isDangerous ? 'warning' : 'help'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface leading-tight">{title}</h3>
            <p className="text-xs text-on-surface-variant font-medium mt-1">Required Action</p>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-3 bg-surface-container-highest rounded-xl text-xs font-bold hover:bg-surface-bright transition-colors"
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-opacity shadow-lg ${
              isDangerous 
                ? 'bg-error text-on-error shadow-error/20 hover:opacity-90' 
                : 'bg-primary text-on-primary shadow-primary/20 hover:opacity-90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
