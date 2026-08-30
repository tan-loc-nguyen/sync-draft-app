import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export interface MergeProps {
  isOpen: boolean,
  onRequestClose: () => void,
  contentLabel?: string,
  children: React.ReactNode
}

const Merge = ({
  isOpen,
  onRequestClose,
  contentLabel='merge-modal',
  children
}: MergeProps) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onRequestClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-[100] bg-black/40' />
        <Dialog.Content
          aria-label={contentLabel}
          className='fixed left-1/2 top-1/2 z-[101] w-[90vw] h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none'
        >
          {/* The panel supplies its own heading; this keeps the dialog labelled
              for screen readers without rendering a second visible title. */}
          <Dialog.Title className='sr-only'>{contentLabel}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default Merge;
