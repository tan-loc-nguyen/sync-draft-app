import React from 'react'

interface TitleInputProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
  onBlur: (event: React.FocusEvent<HTMLInputElement, Element>) => void,
  value: string
}

const TitleInput: React.FC<TitleInputProps> = ({ onChange, onBlur, value}) => {
  return (
    <input
      type="text"
      placeholder={'Untitled document'}
      className="flex-1 min-w-0 h-[48px] ml-4 p-2 bg-white box-border rounded-lg outline-hidden text-2xl truncate font-semibold hover:border-2"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
    />
  )
};

export default TitleInput;