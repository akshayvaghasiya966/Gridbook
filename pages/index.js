import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'
import React from 'react'

const index = () => {
  const router = useRouter()
  const handleClick = (path) => {
    router.push(path)
  }
  return (
    <div className='flex m-2 gap-4 w-fit'>
        <Button onClick={() => handleClick('/finance')}>finance</Button>
        <Button onClick={() => handleClick('/habits')}>habits</Button>
        <Button onClick={() => handleClick('/sleep')}>sleep</Button>
        <Button onClick={() => handleClick('/journal')}>journal</Button>
        <Button onClick={() => handleClick('/mistakes')}>mistakes</Button>
    </div>
  )
}

export default index
