package com.antigravity.collaborativecoding.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
public class EditorController { // You can name this class whatever you want

    private final Map<String, CodePayload> roomMemory = new ConcurrentHashMap<>();

    @MessageMapping("/typing/{roomId}")
    @SendTo("/topic/document/{roomId}")
    public CodePayload handleTyping(@DestinationVariable String roomId, CodePayload payload) {
        // Save the latest state into memory for late joiners
        roomMemory.put(roomId, payload);
        return payload;
    }

    @GetMapping("/api/room/{roomId}")
    public CodePayload getRoomState(@PathVariable String roomId) {
        // Return current state, or default empty state if room is new
        return roomMemory.getOrDefault(roomId, new CodePayload());
    }

    public static class CodePayload {
        private String content;

        private String type;
        private String language;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getLanguage() {
            return language;
        }

        public void setLanguage(String language) {
            this.language = language;
        }
    }

    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/chat/{roomId}")
    public ChatMessage handleChat(@DestinationVariable String roomId, ChatMessage message) {
        return message;
    }

    public static class ChatMessage {
        private String sender;
        private String emoji;
        private String text;
        private String timestamp;

        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        public String getEmoji() { return emoji; }
        public void setEmoji(String emoji) { this.emoji = emoji; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }

    @MessageMapping("/cursor/{roomId}")
    @SendTo("/topic/cursor/{roomId}")
    public CursorPayload handleCursor(@DestinationVariable String roomId, CursorPayload payload) {
        return payload;
    }

    public static class CursorPayload {
        private String name;
        private String emoji;
        private int lineNumber;
        private int column;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmoji() { return emoji; }
        public void setEmoji(String emoji) { this.emoji = emoji; }
        public int getLineNumber() { return lineNumber; }
        public void setLineNumber(int lineNumber) { this.lineNumber = lineNumber; }
        public int getColumn() { return column; }
        public void setColumn(int column) { this.column = column; }
    }
}