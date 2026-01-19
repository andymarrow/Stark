export default {
  control: {
    backgroundColor: 'transparent',
    fontSize: 14,
    fontWeight: 'normal',
    fontFamily: 'monospace',
    minHeight: 100, // matches your textarea min-h
  },

  '&multiLine': {
    control: {
      fontFamily: 'monospace',
      minHeight: 100,
    },
    highlighter: {
      padding: 9,
      border: '1px solid transparent',
    },
    input: {
      padding: 9,
      border: '1px solid transparent', // match border of container
      outline: 'none',
    },
  },

  '&singleLine': {
    display: 'inline-block',
    width: 180,

    highlighter: {
      padding: 1,
      border: '2px inset transparent',
    },
    input: {
      padding: 1,
      border: '2px inset',
    },
  },

  suggestions: {
    list: {
      backgroundColor: 'black',
      border: '1px solid #333',
      fontSize: 12,
      fontFamily: 'monospace',
      overflow: 'hidden',
      zIndex: 9999, // Ensure it sits above other UI
    },
    item: {
      padding: '8px 12px',
      borderBottom: '1px solid #222',
      color: '#888',
      '&focused': {
        backgroundColor: '#111',
        color: '#fff',
      },
    },
  },
}