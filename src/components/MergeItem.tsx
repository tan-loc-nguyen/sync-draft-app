import React from 'react'

import { Merge } from '@/types/merge'

interface MergeItemProps {
  merge: Merge
  onSelect: (merge: Merge) => void
}

const MergeItem: React.FC<MergeItemProps> = ({ merge, onSelect }) => {
  return (
    <button
      type='button'
      className='w-full mb-2 p-2 bg-white rounded-lg hover:bg-gray-200 flex flex-col justify-between items-start cursor-pointer text-left'
      onClick={() => onSelect(merge)}
    >
      <p className='truncate w-full'>{merge.description || 'Merged a draft'}</p>
      <p className='text-gray-500 font-normal text-[13px]'>
        {`Merged by ${merge.mergedById}`}
      </p>
    </button>
  )
}

export default MergeItem
