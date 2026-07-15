import { useState, useEffect, useRef } from "react";
import AttachmentButton from "./AttachmentButton";
import PremiumEmojiPicker from "./PremiumEmojiPicker";
import MessageInput from "./MessageInput";
import SendButton from "./SendButton";
import { getSocket } from "../../../services/socket";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  addMessage,
  setReplyingToMessage,
  addPendingFiles,
} from "../../../features/chat/chatSlice";
import type { Message } from "../../../features/chat/chatTypes";
import {
  chatApi,
  useUploadMultipleMediaMutation,
} from "../../../features/chat/chatApi";
import AttachmentMenu from "./AttachmentMenu";
import PastePreviewModal from "./PastePreviewModal";
import { FaImage, FaVideo } from "react-icons/fa6";
import { IoDocumentText } from "react-icons/io5";

const ChatFooter = ({ disabled = false }: { disabled?: boolean }) => {
  const dispatch = useAppDispatch();
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [pasteFiles, setPasteFiles] = useState<File[]>([]);
  const [uploadMultipleMedia, { isLoading: isUploading }] =
    useUploadMultipleMediaMutation();

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversation = useAppSelector(
    (state) => state.chat.selectedConversation,
  );
  const replyingToMessage = useAppSelector(
    (state) => state.chat.replyingToMessage,
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = (value: string) => {
    const socket = getSocket();
    if (!socket || !conversation) return;

    if (value.trim() && !isTyping) {
      socket.emit("typing", { conversationId: conversation._id });
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: conversation._id });
      setIsTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim() || !conversation) return;

    const socket = getSocket();
    if (!socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTyping) {
      socket.emit("stop_typing", { conversationId: conversation._id });
      setIsTyping(false);
    }

    socket.emit(
      "send_message",
      {
        conversationId: conversation._id,
        text,
        parentMessageId: replyingToMessage?._id,
      },
      (response: { success: boolean; data?: { message: Message } }) => {
        if (response.success && response.data?.message) {
          const sentMessage = response.data.message;
          dispatch(addMessage(sentMessage));

          dispatch(
            chatApi.util.updateQueryData(
              "getConversations",
              undefined,
              (draft) => {
                const conv = draft.data.find((c) => c._id === conversation._id);
                if (conv) {
                  conv.lastMessage = {
                    _id: sentMessage._id,
                    conversation: sentMessage.conversation,
                    sender: sentMessage.sender._id,
                    messageType: sentMessage.messageType,
                    text: sentMessage.text,
                    mediaUrl: sentMessage.mediaUrl,
                    readBy: sentMessage.readBy,
                    deliveredTo: sentMessage.deliveredTo,
                    createdAt: sentMessage.createdAt,
                    updatedAt: sentMessage.updatedAt,
                  };

                  const index = draft.data.indexOf(conv);
                  if (index > -1) {
                    draft.data.splice(index, 1);
                    draft.data.unshift(conv);
                  }
                }
              },
            ),
          );
        }
      },
    );

    setText("");
    dispatch(setReplyingToMessage(null));
  };

  const handleFileSelect = async (
    files: FileList,
    _type: "document" | "media",
  ) => {
    if (!conversation) return;
    dispatch(addPendingFiles(Array.from(files)));
    setIsAttachmentMenuOpen(false);

    // try {
    //   const formData = new FormData();
    //   for (let i = 0; i < files.length; i++) {
    //     formData.append("files", files[i]);
    //   }

    //   const uploadResponse = await uploadMultipleMedia(formData).unwrap();

    //   if (uploadResponse.success && uploadResponse.data) {
    //     const socket = getSocket();
    //     if (!socket) return;

    //     for (const fileData of uploadResponse.data) {
    //       const { mediaUrl, messageType } = fileData;
    //       socket.emit(
    //         "send_message",
    //         {
    //           conversationId: conversation._id,
    //           text: "",
    //           messageType: messageType,
    //           mediaUrl: mediaUrl,
    //           parentMessageId: replyingToMessage?._id,
    //         },
    //         (response: { success: boolean; data?: { message: Message } }) => {
    //           if (response.success && response.data?.message) {
    //             const sentMessage = response.data.message;
    //             dispatch(addMessage(sentMessage));

    //             dispatch(
    //               chatApi.util.updateQueryData(
    //                 "getConversations",
    //                 undefined,
    //                 (draft) => {
    //                   const conv = draft.data.find(
    //                     (c) => c._id === conversation._id,
    //                   );
    //                   if (conv) {
    //                     conv.lastMessage = {
    //                       _id: sentMessage._id,
    //                       conversation: sentMessage.conversation,
    //                       sender: sentMessage.sender._id,
    //                       messageType: sentMessage.messageType,
    //                       text: sentMessage.text,
    //                       mediaUrl: sentMessage.mediaUrl,
    //                       readBy: sentMessage.readBy,
    //                       deliveredTo: sentMessage.deliveredTo,
    //                       createdAt: sentMessage.createdAt,
    //                       updatedAt: sentMessage.updatedAt,
    //                     };

    //                     const index = draft.data.indexOf(conv);
    //                     if (index > -1) {
    //                       draft.data.splice(index, 1);
    //                       draft.data.unshift(conv);
    //                     }
    //                   }
    //                 },
    //               ),
    //             );
    //           }
    //         },
    //       );
    //     }
    //   }
    // } catch (error) {
    //   console.error("Failed to upload media:", error);
    // } finally {
    //   setIsAttachmentMenuOpen(false);
    //   dispatch(setReplyingToMessage(null));
    // }
  };

  const handleSelectEmoji = (emoji: string) => {
    const updatedText = text + emoji;
    setText(updatedText);
    handleTyping(updatedText);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardItems = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      setPasteFiles((prev) => [...prev, ...files]);
    }
  };

  const handlePasteSend = async (files: File[], caption: string) => {
    if (!conversation) return;

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const uploadResponse = await uploadMultipleMedia(formData).unwrap();

      if (uploadResponse.success && uploadResponse.data) {
        const socket = getSocket();
        if (!socket) return;

        for (let i = 0; i < uploadResponse.data.length; i++) {
          const fileData = uploadResponse.data[i];
          const { mediaUrl, messageType } = fileData;

          const msgCaption = i === 0 ? caption : "";

          socket.emit(
            "send_message",
            {
              conversationId: conversation._id,
              text: msgCaption,
              messageType: messageType,
              mediaUrl: mediaUrl,
              parentMessageId: replyingToMessage?._id,
            },
            (response: { success: boolean; data?: { message: Message } }) => {
              if (response.success && response.data?.message) {
                const sentMessage = response.data.message;
                dispatch(addMessage(sentMessage));

                dispatch(
                  chatApi.util.updateQueryData(
                    "getConversations",
                    undefined,
                    (draft) => {
                      const conv = draft.data.find(
                        (c) => c._id === conversation._id,
                      );
                      if (conv) {
                        conv.lastMessage = {
                          _id: sentMessage._id,
                          conversation: sentMessage.conversation,
                          sender: sentMessage.sender._id,
                          messageType: sentMessage.messageType,
                          text: sentMessage.text,
                          mediaUrl: sentMessage.mediaUrl,
                          readBy: sentMessage.readBy,
                          deliveredTo: sentMessage.deliveredTo,
                          createdAt: sentMessage.createdAt,
                          updatedAt: sentMessage.updatedAt,
                        };

                        const index = draft.data.indexOf(conv);
                        if (index > -1) {
                          draft.data.splice(index, 1);
                          draft.data.unshift(conv);
                        }
                      }
                    },
                  ),
                );
              }
            },
          );
        }
      }
    } catch (error) {
      console.error("Failed to send pasted media:", error);
    } finally {
      setPasteFiles([]);
      dispatch(setReplyingToMessage(null));
    }
  };

  const renderReplyPreview = (message: Message) => {
    switch (message.messageType) {
      case "image":
        return (
          <span className="d-inline-flex align-items-center gap-1">
            <FaImage size={13} className="text-muted" />
            Photo
          </span>
        );

      case "video":
        return (
          <span className="d-inline-flex align-items-center gap-1">
            <FaVideo size={13} className="text-muted" />
            Video
          </span>
        );

      case "file":
        return (
          <span className="d-inline-flex align-items-center gap-1">
            <IoDocumentText size={14} className="text-muted" />
            File
          </span>
        );

      default:
        return message.text;
    }
  };

  return (
    <footer className="chat-main-footer w-100 position-relative d-flex flex-column gap-2 px-3 py-3 border-top border-light bg-white">
      {/* Disabled State Message */}
      {disabled && (
        <div className="d-flex align-items-center justify-content-center w-100 text-muted small">
          This chat has been ended. You can no longer send messages.
        </div>
      )}

      {/* Replying Preview Container */}
      {replyingToMessage && !disabled && (
        <div
          className="d-flex align-items-center justify-content-between w-100 px-3 py-2 bg-light border-start border-4 border-success rounded mb-1"
          style={{ fontSize: "0.8rem" }}
        >
          <div className="d-flex flex-column text-start">
            <span className="fw-bold text-success">
              Replying to {replyingToMessage.sender.name}
            </span>
            <span
              className="text-muted text-truncate"
              style={{ maxWidth: "350px" }}
            >
              {renderReplyPreview(replyingToMessage)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setReplyingToMessage(null))}
            className="btn-close"
            style={{ fontSize: "0.65rem" }}
            aria-label="Cancel reply"
          ></button>
        </div>
      )}

      {/* Input Controls Row */}
      <div className="d-flex align-items-center gap-2 w-100">
        <AttachmentMenu
          isOpen={isAttachmentMenuOpen}
          onClose={() => setIsAttachmentMenuOpen(false)}
          onFileSelect={handleFileSelect}
        />
        <PremiumEmojiPicker
          onSelectEmoji={handleSelectEmoji}
          disabled={isUploading || disabled}
        />
        <AttachmentButton
          isOpen={isAttachmentMenuOpen}
          onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
          disabled={isUploading || disabled}
        />
        <MessageInput
          value={text}
          onChange={(e) => {
            const newText = e.target.value;
            setText(newText);
            handleTyping(newText);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onPaste={handlePaste}
          disabled={isUploading || disabled}
          placeholder={disabled ? "Chat ended" : undefined}
        />
        <SendButton
          disabled={!text.trim() || isUploading || disabled}
          onClick={handleSend}
        />
      </div>

      {pasteFiles.length > 0 && (
        <PastePreviewModal
          files={pasteFiles}
          onClose={() => setPasteFiles([])}
          onSend={(caption) => handlePasteSend(pasteFiles, caption)}
          isUploading={isUploading}
        />
      )}
    </footer>
  );
};

export default ChatFooter;
