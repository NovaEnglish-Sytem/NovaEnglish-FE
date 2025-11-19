import React from 'react'
import PropTypes from 'prop-types'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import 'ckeditor5/ckeditor5.css'
import {
	ClassicEditor,
	Autosave,
	Essentials,
	Paragraph,
	Bold,
	Italic,
	Underline,
	Alignment,
	Indent,
	IndentBlock,
	List,
	RemoveFormat,
	HorizontalLine,
	Table,
	TableToolbar,
	FontBackgroundColor,
	FontColor,
	FontSize,
} from 'ckeditor5'

export default function StoryEditor({
  value = '',
  onChange,
  className = '',
  placeholder = 'Tulis passage atau story di sini...',
  minHeight = 380,
  readOnly = false,
}) {
  const editorConfig = React.useMemo(() => ({
    placeholder,
    licenseKey: 'GPL',
    plugins: [
      Autosave,
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Underline,
      Alignment,
      Indent,
      IndentBlock,
      List,
      RemoveFormat,
      HorizontalLine,
      Table,
      TableToolbar,
      FontBackgroundColor,
      FontColor,
      FontSize,
    ],
    toolbar: {
      items: [
        'undo', 'redo', '|',
        'outdent', 'indent', '|',
        'fontSize', 'fontColor', 'fontBackgroundColor', '|',
        'bold', 'italic', 'underline', '|',
        'alignment', 'removeFormat', '|',
        'bulletedList', 'numberedList', '|',
        'horizontalLine', 'insertTable', '|'
      ]
    },
    table: {
      contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
    },
    fontSize: {
      options: [ 8, 10, 12, 'default', 14, 16, 18, 20, 24, 28, 32, 36 ],
      supportAllValues: true
    },
    fontFamily: {
      supportAllValues: true
    },
    link: {
      addTargetToExternalLinks: true
    }
  }), [placeholder])

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      <div className="rounded-md border border-gray-200 p-2 bg-white">
        <CKEditor
          editor={ClassicEditor}
          data={value || ''}
          config={editorConfig}
          disabled={readOnly}
          onReady={(editor) => {
            try {
              const editable = editor.ui.view.editable?.element
              if (editable) {
                editable.style.minHeight = `${minHeight}px`
              }
            } catch (_) {}
          }}
          onChange={(_, editor) => {
            const data = editor.getData()
            onChange?.(data)
          }}
        />
      </div>
    </div>
  )
}

StoryEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  minHeight: PropTypes.number,
  readOnly: PropTypes.bool,
}
