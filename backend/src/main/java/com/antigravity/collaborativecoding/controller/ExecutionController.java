package com.antigravity.collaborativecoding.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/execute")
public class ExecutionController {

    @Value("${onlinecompiler.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping
    public ResponseEntity<Map<String, Object>> executeCode(@RequestBody ExecutionRequest request) {
        String url = "https://api.onlinecompiler.io/api/run-code-sync/";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", apiKey);
        headers.set("Content-Type", "application/json");

        // Map frontend languages to onlinecompiler.io compilers
        String compiler = mapLanguageToCompiler(request.getLanguage());

        Map<String, String> body = new HashMap<>();
        body.put("compiler", compiler);
        body.put("code", request.getCode());
        if (request.getInput() != null && !request.getInput().isEmpty()) {
            body.put("input", request.getInput());
        }

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            Map<String, Object> result = new HashMap<>();
            
            // Reformat response to match what the frontend expects (or just pass it through)
            // onlinecompiler.io returns { output: "...", status: "..." }
            Map bodyResponse = response.getBody();
            if (bodyResponse != null && bodyResponse.containsKey("output")) {
                result.put("run", Map.of("output", bodyResponse.get("output")));
            } else {
                result.put("run", Map.of("output", "Execution finished but no output returned."));
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("message", "Error executing code: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    private String mapLanguageToCompiler(String language) {
        switch (language.toLowerCase()) {
            case "javascript":
            case "typescript":
                return "typescript-deno";
            case "python":
                return "python-3.14";
            case "java":
                return "openjdk-25";
            case "cpp":
                return "g++-15";
            case "c":
                return "gcc-15";
            case "csharp":
                return "dotnet-csharp-9";
            case "fsharp":
                return "dotnet-fsharp-9";
            case "go":
                return "go-1.26";
            case "rust":
                return "rust-1.93";
            case "php":
                return "php-8.5";
            case "ruby":
                return "ruby-4.0";
            case "haskell":
                return "haskell";
            default:
                return language;
        }
    }

    public static class ExecutionRequest {
        private String language;
        private String code;
        private String input;

        public String getLanguage() {
            return language;
        }

        public void setLanguage(String language) {
            this.language = language;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }
        
        public String getInput() {
            return input;
        }

        public void setInput(String input) {
            this.input = input;
        }
    }
}
