package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.core5.http.HttpStatus;
import org.apache.hc.core5.http.ParseException;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final CloseableHttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.max-output-tokens:1024}")
    private Integer maxOutputTokens;

    @Value("${gemini.temperature:0.7}")
    private Double temperature;

    public GeminiService(CloseableHttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    public String generateText(String prompt) throws IOException {
        HttpPost httpPost = new HttpPost(apiUrl);
        httpPost.addHeader("Content-Type", "application/json");

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt))
                )
            ),
            "generationConfig", Map.of(
                "temperature", temperature,
                "maxOutputTokens", maxOutputTokens
            )
        );

        httpPost.setEntity(new StringEntity(objectMapper.writeValueAsString(requestBody)));

        try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
            String responseBody;
            try {
                responseBody = EntityUtils.toString(response.getEntity());
            } catch (ParseException e) {
                throw new IOException("Failed to parse Gemini response", e);
            }
            int statusCode = response.getCode();
            if (statusCode < HttpStatus.SC_SUCCESS || statusCode >= HttpStatus.SC_REDIRECTION) {
                throw new IOException("Gemini request failed with status " + statusCode + ": " + responseBody);
            }

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (!textNode.isMissingNode() && !textNode.isNull()) {
                return textNode.asText();
            }

            JsonNode errorNode = root.path("error").path("message");
            if (!errorNode.isMissingNode() && !errorNode.isNull()) {
                throw new IOException("Gemini API error: " + errorNode.asText());
            }

            logger.warn("Gemini response did not contain text content: {}", responseBody);
            return responseBody;
        }
    }
}
