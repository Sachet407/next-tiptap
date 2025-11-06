"use client";

import { useCallback, useEffect, useRef } from "react";


import TiptapEditor, { type TiptapEditorRef } from "@/components/tiptap-editor";

import { getEditorContent } from "@/components/tiptap-editor/helpers/tiptap";



export default function EditForm() {
  const editorRef = useRef<TiptapEditorRef>(null);




  const calculateReadingTime = useCallback(() => {
    const editor = editorRef.current;
    const wordCount = editor?.storage.characterCount.words() ?? 0;
    return Math.max(1, Math.ceil(wordCount / 150));
  }, []);

  const handleSave = () => {
      const html = getEditorContent(editorRef.current, "html");
      console.log("📝 Current HTML:", html);
  }




  return (
    <div className="flex flex-col gap-6">
            <TiptapEditor
              ref={editorRef}
              output="html"
              minHeight={320}
              maxHeight={640}
              maxWidth={700}
              placeholder={{
                paragraph: "Type your content here...",
                imageCaption: "Type caption for image (optional)",
              }}
            />
            <button onClick={handleSave} className="bg-purple-700 p-7 text-xl">save</button>
    </div>
  );
}
