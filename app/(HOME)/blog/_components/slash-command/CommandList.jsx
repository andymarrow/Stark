import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export default forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
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
    <div className="bg-black border border-border shadow-2xl rounded-none overflow-hidden min-w-[240px] z-[9999] flex flex-col">
      <div className="px-3 py-1.5 bg-secondary/10 border-b border-border text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
        Command_Palette
      </div>
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
        {props.items.length ? (
          props.items.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                className={`flex items-center gap-3 w-full text-left px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all
                  ${index === selectedIndex 
                      ? 'bg-accent/10 text-accent border-l-2 border-accent' 
                      : 'text-zinc-400 hover:bg-secondary/50 border-l-2 border-transparent'}
                `}
                key={index}
                onClick={() => selectItem(index)}
              >
                <Icon size={14} className={index === selectedIndex ? "text-accent" : "text-muted-foreground"} />
                {item.title}
              </button>
            )
          })
        ) : (
          <div className="px-3 py-4 text-xs text-muted-foreground font-mono text-center uppercase tracking-widest">
            Null_Command
          </div>
        )}
      </div>
    </div>
  )
})