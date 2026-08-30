import React from 'react';

export interface DraftItemProps {
  docId: string,
  draftId: string,
  title: string,
  isMerged: boolean,
  createdAt: string
}

const DraftItem: React.FC<DraftItemProps> = ({
  docId,
  draftId,
  title,
  isMerged,
  createdAt
}) => {
  return (
    <a
      href={`/draft/${docId}/${draftId}`}
      className='w-full mb-2 p-2 bg-white rounded-lg hover:bg-gray-200 flex flex-col justify-between items-start'
    >
      <p className='truncate w-full'>{title}</p>
      <p className='text-gray-500 font-normal text-[13px]'>
        {isMerged ? `Merged · ${createdAt}` : `Created ${createdAt}`}
      </p>
    </a>
  )
};

export default DraftItem;
