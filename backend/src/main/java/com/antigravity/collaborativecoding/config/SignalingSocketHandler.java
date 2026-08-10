package com.antigravity.collaborativecoding.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SignalingSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(SignalingSocketHandler.class);
    
    // Map from topic-name to set of subscribed WebSocketSessions
    private final ConcurrentHashMap<String, Set<WebSocketSession>> topics = new ConcurrentHashMap<>();
    
    // Map from session ID to set of topics the session is subscribed to
    private final ConcurrentHashMap<String, Set<String>> sessionTopics = new ConcurrentHashMap<>();
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        logger.info("New signaling connection: " + session.getId());
        sessionTopics.put(session.getId(), Collections.synchronizedSet(new HashSet<>()));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        logger.info("Signaling connection closed: " + session.getId());
        Set<String> subscribedTopics = sessionTopics.remove(session.getId());
        if (subscribedTopics != null) {
            for (String topic : subscribedTopics) {
                Set<WebSocketSession> subs = topics.get(topic);
                if (subs != null) {
                    subs.remove(session);
                    if (subs.isEmpty()) {
                        topics.remove(topic);
                    }
                }
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            JsonNode jsonNode = objectMapper.readTree(message.getPayload());
            if (jsonNode.has("type")) {
                String type = jsonNode.get("type").asText();

                switch (type) {
                    case "subscribe":
                        if (jsonNode.has("topics") && jsonNode.get("topics").isArray()) {
                            for (JsonNode topicNode : jsonNode.get("topics")) {
                                String topic = topicNode.asText();
                                topics.computeIfAbsent(topic, k -> Collections.synchronizedSet(new HashSet<>())).add(session);
                                sessionTopics.get(session.getId()).add(topic);
                            }
                        }
                        break;
                    case "unsubscribe":
                        if (jsonNode.has("topics") && jsonNode.get("topics").isArray()) {
                            for (JsonNode topicNode : jsonNode.get("topics")) {
                                String topic = topicNode.asText();
                                Set<WebSocketSession> subs = topics.get(topic);
                                if (subs != null) {
                                    subs.remove(session);
                                }
                                sessionTopics.get(session.getId()).remove(topic);
                            }
                        }
                        break;
                    case "publish":
                        if (jsonNode.has("topic")) {
                            String topic = jsonNode.get("topic").asText();
                            Set<WebSocketSession> receivers = topics.get(topic);
                            if (receivers != null) {
                                ((ObjectNode) jsonNode).put("clients", receivers.size());
                                String outgoingMsg = objectMapper.writeValueAsString(jsonNode);
                                TextMessage textMessage = new TextMessage(outgoingMsg);
                                
                                for (WebSocketSession receiver : receivers) {
                                    if (receiver.isOpen()) {
                                        try {
                                            receiver.sendMessage(textMessage);
                                        } catch (IOException e) {
                                            logger.error("Error sending message to receiver", e);
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case "ping":
                        ObjectNode pongResponse = objectMapper.createObjectNode();
                        pongResponse.put("type", "pong");
                        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(pongResponse)));
                        break;
                }
            }
        } catch (Exception e) {
            logger.error("Error handling signaling message", e);
        }
    }
}
