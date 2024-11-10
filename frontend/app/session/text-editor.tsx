import { useEffect, useState } from 'react'
import { Content, Extension } from '@tiptap/react'
import { MinimalTiptapEditor } from '@/components/minimal-tiptap/minimal-tiptap'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { getUsername } from '@/app/utils/cookie-manager';
import { HocuspocusProvider } from '@hocuspocus/provider';

interface TextEditorProps {
    sessionId: string;
    provider: HocuspocusProvider;
}

export default function TextEditor({ sessionId, provider }: TextEditorProps) {
    const [value, setValue] = useState<Content>('')
    const [collaborationExtensions, setCollaborationExtensions] = useState<Extension[]>([]);

    useEffect(() => {
        const collaborationExtensions = [
            Collaboration.configure({
                document: provider.document,
                field: 'content',
            }),
            CollaborationCursor.configure({
                provider: provider,
                user: { name: getUsername(), color: '#E9D7FE' },
            }),
        ]

        setCollaborationExtensions(collaborationExtensions);
    }, [provider, sessionId])

    if (collaborationExtensions.length === 0) {
        return <div>Loading editor...</div>
    }

    return (
        <TooltipProvider>
            <MinimalTiptapEditor
                value={value}
                onChange={setValue}
                className="w-full text-black"
                editorContentClassName="p-5"
                output="html"
                placeholder="Type your notes here..."
                autofocus={false}
                editable={true}
                editorClassName="focus:outline-none"
                immediatelyRender={false}
                additionalExtensions={collaborationExtensions}
            />
        </TooltipProvider>
    )
}
