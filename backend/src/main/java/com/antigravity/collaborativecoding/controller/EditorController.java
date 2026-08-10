package com.antigravity.collaborativecoding.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class EditorController { // You can name this class whatever you want

    @MessageMapping("/typing/{roomId}")
    @SendTo("/topic/document/{roomId}")
    public CodePayload handleTyping(@DestinationVariable String roomId, CodePayload payload) {
        return payload;
    }

    public static class CodePayload {
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}