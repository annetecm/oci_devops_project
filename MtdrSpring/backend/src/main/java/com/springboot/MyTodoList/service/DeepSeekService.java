package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.core5.http.HttpStatus;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DeepSeekService{
    private final CloseableHttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${deepseek.api.url}")
    private String apiUrl;

    @Value("${deepseek.api.key}")
    private String apiKey;

    public DeepSeekService(CloseableHttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    public String generateText(String prompt) throws IOException, org.apache.hc.core5.http.ParseException {
        HttpPost httpPost = new HttpPost(apiUrl);
        httpPost.addHeader("Content-Type", "application/json");
        httpPost.addHeader("Authorization", "Bearer " + apiKey);
        String requestBody = objectMapper.writeValueAsString(
            java.util.Map.of(
                "model", "deepseek-chat",
                "messages", java.util.List.of(java.util.Map.of("role", "user", "content", prompt))
            )
        );

        try {
            httpPost.setEntity(new StringEntity(requestBody));
            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                String responseBody = EntityUtils.toString(response.getEntity());
                int statusCode = response.getCode();
                if (statusCode < HttpStatus.SC_SUCCESS || statusCode >= HttpStatus.SC_REDIRECTION) {
                    throw new IOException("DeepSeek request failed with status " + statusCode + ": " + responseBody);
                }
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
                if (contentNode.isMissingNode() || contentNode.isNull()) {
                    return responseBody;
                }
                return contentNode.asText();
            }
        } catch (IOException e) {
            throw e;
        }
    }
}
