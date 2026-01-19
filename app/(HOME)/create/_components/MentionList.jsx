import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import Image from 'next/image'

export default forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index) => {
    const item = props.items[index]
    if (item) {
      props.command({ id: item.username, label: item.username }) // Using username as ID
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }
      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }
      if (event.key === 'Enter') {
        enterHandler()
        return true
      }
      return false
    },
  }))

  return (
    <div className="bg-black border border-border shadow-xl rounded-none overflow-hidden min-w-[200px] z-50">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-mono transition-colors
              ${index === selectedIndex ? 'bg-secondary text-accent' : 'text-zinc-400 hover:bg-secondary/50'}
            `}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className="relative w-5 h-5 bg-secondary border border-border overflow-hidden">
                <Image 
                    src={item.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                    alt={item.username} 
                    fill 
                    className="object-cover" 
                />
            </div>
            <span>@{item.username}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-xs text-muted-foreground font-mono">No users found</div>
      )}
    </div>
  )
})