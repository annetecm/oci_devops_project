package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TelegramMessage;
import com.springboot.MyTodoList.model.TelegramSummary;
import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.GeminiService;
import com.springboot.MyTodoList.service.TaskService;
import com.springboot.MyTodoList.service.TelegramMessageService;
import com.springboot.MyTodoList.service.TelegramSummaryService;
import com.springboot.MyTodoList.service.ToDoItemService;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public class BotActions{

    private static final Logger logger = LoggerFactory.getLogger(BotActions.class);
    private static final DateTimeFormatter TASK_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final int DEFAULT_SUMMARIZE_WINDOW = 20;
    private static final int MIN_SUMMARIZE_WINDOW = 5;
    private static final int MAX_SUMMARIZE_WINDOW = 30;
    private static final Map<Long, TaskCreationState> taskCreationStates = new HashMap<>();

    String requestText;
    long chatId;
    Long telegramUserId;
    String telegramUsername;
    TelegramClient telegramClient;
    boolean exit;

    ToDoItemService todoService;
    TaskService taskService;
    GeminiService geminiService;
    TelegramMessageService telegramMessageService;
    TelegramSummaryService telegramSummaryService;

    public BotActions(
        TelegramClient tc,
        ToDoItemService ts,
        TaskService taskSvc,
        GeminiService gs,
        TelegramMessageService tmSvc,
        TelegramSummaryService tsSvc
    ){
        telegramClient = tc;
        todoService = ts;
        taskService = taskSvc;
        geminiService = gs;
        telegramMessageService = tmSvc;
        telegramSummaryService = tsSvc;
        exit  = false;
    }

    public void setRequestText(String cmd){
        requestText=cmd;
    }

    public void setChatId(long chId){
        chatId=chId;
    }

    public void setTelegramUserId(Long id){
        telegramUserId=id;
    }

    public void setTelegramUsername(String username){
        telegramUsername=username;
    }

    public void setTelegramClient(TelegramClient tc){
        telegramClient=tc;
    }

    public void setTodoService(ToDoItemService tsvc){
        todoService = tsvc;
    }

    public ToDoItemService getTodoService(){
        return todoService;
    }

    public void fnStart() {
        if (!(requestText.equals(BotCommands.START_COMMAND.getCommand()) || requestText.equals(BotLabels.SHOW_MAIN_SCREEN.getLabel())) || exit) 
            return;

        BotHelper.sendMessageToTelegram(chatId, BotMessages.HELLO_MYTODO_BOT.getMessage(), telegramClient,  ReplyKeyboardMarkup
            .builder()
            .keyboardRow(new KeyboardRow(BotLabels.PENDING_TASKS.getLabel(), BotLabels.CREATE_TASK.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel(),BotLabels.HIDE_MAIN_SCREEN.getLabel()))
            .build()
        );
        exit = true;
    }

    
    public void fnHide(){
        if (requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
				|| requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel()) && !exit)
			BotHelper.sendMessageToTelegram(chatId, BotMessages.BYE.getMessage(), telegramClient);
        else
            return;
        exit = true;
    }



    public void fnWhoAmI() {
        if (exit || requestText == null) {
            return;
        }

        String trimmed = requestText.trim();
        String lowered = trimmed.toLowerCase();
        String slashCommand = BotCommands.WHO_AM_I.getCommand();
        String plainCommand = slashCommand.substring(1);

        if (!(lowered.equals(slashCommand) || lowered.equals(plainCommand))) {
            return;
        }

        String username = (telegramUsername == null || telegramUsername.isBlank()) ? "(no username)" : "@" + telegramUsername;
        String userIdText = telegramUserId != null ? telegramUserId.toString() : "(unavailable)";
        String response = "Your Telegram user ID is: " + userIdText + "\nUsername: " + username;

        BotHelper.sendMessageToTelegram(chatId, response, telegramClient);
        exit = true;
    }

    public void fnPendingTasks() {
        if (exit || requestText == null) {
            return;
        }

        String trimmed = requestText.trim();
        String lowered = trimmed.toLowerCase();
        boolean matchesCommand = lowered.equals(BotCommands.PENDING_TASKS.getCommand())
                || lowered.equals(BotLabels.PENDING_TASKS.getLabel().toLowerCase());

        if (!matchesCommand) {
            return;
        }

        if (telegramUserId == null) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.TELEGRAM_ACCOUNT_NOT_LINKED.getMessage(), telegramClient);
            exit = true;
            return;
        }

        if (!taskService.isTelegramUserLinked(telegramUserId)) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.TELEGRAM_ACCOUNT_NOT_LINKED.getMessage(), telegramClient);
            exit = true;
            return;
        }

        if (!taskService.isTelegramUserDeveloper(telegramUserId)) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.TELEGRAM_USER_NOT_DEVELOPER.getMessage(), telegramClient);
            exit = true;
            return;
        }

        List<Task> pendingTasks = taskService.findPendingTasksByTelegramUserId(telegramUserId);
        if (pendingTasks.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.PENDING_TASKS_EMPTY.getMessage(), telegramClient);
            exit = true;
            return;
        }

        StringBuilder response = new StringBuilder("Pending tasks:\n\n");
        for (Task task : pendingTasks) {
            response.append("Task #").append(task.getTaskID()).append("\n")
                .append("Name: ").append(task.getName()).append("\n")
                .append("Status: ").append(task.getStatus()).append("\n")
                .append("Priority: ").append(task.getPriority()).append("\n")
                .append("Due: ").append(task.getDeadline() != null ? task.getDeadline().format(TASK_DATE_FORMATTER) : "n/a")
                .append("\n")
                .append("--------------------")
                .append("\n");
        }

        BotHelper.sendMessageToTelegram(chatId, response.toString(), telegramClient);
        exit = true;
    }


    public void fnSummarize() {
        if (exit || requestText == null) {
            return;
        }

        String trimmed = requestText.trim();
        String lowered = trimmed.toLowerCase();
        String summarizeCommand = BotCommands.SUMMARIZE.getCommand();
        if (!(lowered.equals(summarizeCommand) || lowered.startsWith(summarizeCommand + " "))) {
            return;
        }

        if (telegramUserId == null || !taskService.isTelegramUserLinked(telegramUserId)) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.TELEGRAM_ACCOUNT_NOT_LINKED.getMessage(), telegramClient);
            exit = true;
            return;
        }

        Integer requestedWindow = parseSummaryWindow(trimmed);
        if (requestedWindow == null) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.SUMMARIZE_USAGE.getMessage(), telegramClient);
            exit = true;
            return;
        }

        if (requestedWindow < MIN_SUMMARIZE_WINDOW || requestedWindow > MAX_SUMMARIZE_WINDOW) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.SUMMARIZE_INVALID_RANGE.getMessage(), telegramClient);
            exit = true;
            return;
        }

        List<TelegramMessage> recentMessages = telegramMessageService.findRecentMessages(chatId, requestedWindow);
        if (recentMessages.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.SUMMARIZE_NO_MESSAGES.getMessage(), telegramClient);
            exit = true;
            return;
        }

        try {
            List<TelegramMessage> relatedMessages = telegramMessageService.findRelatedMessages(chatId, recentMessages, 3);
            TelegramSummary summary = telegramSummaryService.generateAndSaveSummary(
                chatId,
                telegramUserId,
                requestedWindow,
                recentMessages,
                relatedMessages
            );
            BotHelper.sendMessageToTelegram(chatId, formatSummaryReply(summary), telegramClient);
        } catch (Exception ex) {
            logger.error("Error generating Telegram summary for chat {} using Gemini API", chatId, ex);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.SUMMARIZE_FAILED.getMessage(), telegramClient);
        } finally {
            exit = true;
        }
    }

    public void fnLLM(){
        logger.info("Calling LLM");
        if (!(requestText.contains(BotCommands.LLM_REQ.getCommand())) || exit)
            return;
        
        String prompt = "Dame los datos del clima en mty";
        String out = "<empty>";
        try{
            out = geminiService.generateText(prompt);
        }catch(Exception exc){
            logger.error("Error calling Gemini API from /llm", exc);
        }

        BotHelper.sendMessageToTelegram(chatId, "LLM: "+out, telegramClient, null);

    }

    // Task Creation Flow Methods
    public void fnCreateTask() {
        if (exit || requestText == null) {
            return;
        }

        String trimmed = requestText.trim();
        String lowered = trimmed.toLowerCase();
        boolean startsCommand = lowered.startsWith(BotCommands.CREATE_TASK.getCommand()) 
                || lowered.startsWith(BotLabels.CREATE_TASK.getLabel().toLowerCase());
        
        // Check if user is in an active conversation
        TaskCreationState state = taskCreationStates.get(chatId);
        
        if (state == null && !startsCommand) {
            return; // Not starting task creation and not in conversation
        }

        // Cancel option
        if (requestText.equals(BotLabels.CANCEL.getLabel()) && state != null) {
            taskCreationStates.remove(chatId);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_CANCELLED.getMessage(), telegramClient);
            exit = true;
            return;
        }

        // Start task creation
        if (state == null && startsCommand) {
            state = new TaskCreationState();
            taskCreationStates.put(chatId, state);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_START.getMessage(), telegramClient);
            exit = true;
            return;
        }

        // Continue in conversation
        if (state != null) {
            handleTaskCreationStep(state);
            exit = true;
            return;
        }
    }

    private void handleTaskCreationStep(TaskCreationState state) {
        switch (state.getStep()) {
            case 1:
                handleTaskNameStep(state);
                break;
            case 2:
                handleTaskDescriptionStep(state);
                break;
            case 3:
                handleProjectIdStep(state);
                break;
            case 4:
                handleTaskTypeStep(state);
                break;
            case 5:
                handlePriorityStep(state);
                break;
            case 6:
                handleEstimatedTimeStep(state);
                break;
            case 7:
                handleDeadlineStep(state);
                break;
            case 8:
                handleStatusStep(state);
                break;
            case 9:
                handleSprintStep(state);
                break;
            default:
                finalizeTaskCreation(state);
        }
    }

    private void handleTaskNameStep(TaskCreationState state) {
        String taskName = requestText.trim();
        if (taskName.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_INVALID_INPUT.getMessage(), telegramClient);
            return;
        }
        state.setName(taskName);
        state.nextStep();
        BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_PROMPT_DESCRIPTION.getMessage(), telegramClient);
    }

    private void handleTaskDescriptionStep(TaskCreationState state) {
        String description = requestText.trim();
        if (description.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_INVALID_INPUT.getMessage(), telegramClient);
            return;
        }
        state.setDescription(description);
        state.nextStep();
        BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_PROMPT_PROJECT.getMessage(), telegramClient);
    }

    private void handleProjectIdStep(TaskCreationState state) {
        try {
            int projectId = Integer.parseInt(requestText.trim());
            if (projectId <= 0) {
                BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_INVALID_INPUT.getMessage(), telegramClient);
                return;
            }
            state.setProjectId(projectId);
            state.nextStep();
            // Send task type keyboard
            ReplyKeyboardMarkup typeKeyboard = ReplyKeyboardMarkup.builder()
                .resizeKeyboard(true)
                .oneTimeKeyboard(true)
                .keyboardRow(new KeyboardRow(BotLabels.TYPE_NEW_FEATURE.getLabel()))
                .keyboardRow(new KeyboardRow(BotLabels.TYPE_BUG_FIX.getLabel()))
                .keyboardRow(new KeyboardRow(BotLabels.TYPE_DOCUMENTATION.getLabel()))
                .keyboardRow(new KeyboardRow(BotLabels.TYPE_REVIEW.getLabel()))
                .keyboardRow(new KeyboardRow(BotLabels.TYPE_IMPROVEMENT.getLabel()))
                .keyboardRow(new KeyboardRow(BotLabels.CANCEL.getLabel()))
                .build();
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_PROMPT_TYPE.getMessage(), telegramClient, typeKeyboard);
        } catch (NumberFormatException e) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_INVALID_INPUT.getMessage(), telegramClient);
        }
    }

    private void handleTaskTypeStep(TaskCreationState state) {
        String taskType = mapTaskTypeLabel(requestText.trim());
        if (taskType == null) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_INVALID_INPUT.getMessage(), telegramClient);
            return;
        }
        state.setTaskType(taskType);
        state.nextStep();
        // Send priority keyboard
        ReplyKeyboardMarkup priorityKeyboard = ReplyKeyboardMarkup.builder()
            .resizeKeyboard(true)
            .oneTimeKeyboard(true)
            .keyboardRow(new KeyboardRow(BotLabels.PRIORITY_LOW.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.PRIORITY_MEDIUM.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.PRIORITY_HIGH.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.CANCEL.getLabel()))
            .build();
        BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_PROMPT_PRIORITY.getMessage(), telegramClient, priorityKeyboard);
    }

    private void handlePriorityStep(TaskCreationState state) {
        String priority = mapPriorityLabel(requestText.trim());
        if (priority == null) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_INVALID_INPUT.getMessage(), telegramClient);
            return;
        }
        state.setPriority(priority);
        state.nextStep();
        BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_PROMPT_ESTIMATED_TIME.getMessage(), telegramClient);
    }

    private void handleEstimatedTimeStep(TaskCreationState state) {
        try {
            int estimatedTime = Integer.parseInt(requestText.trim());
            if (estimatedTime <= 0) {
                BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_INVALID_INPUT.getMessage(), telegramClient);
                return;
            }
            state.setEstimatedTime(estimatedTime);
            state.nextStep();
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_PROMPT_DEADLINE.getMessage(), telegramClient);
        } catch (NumberFormatException e) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_INVALID_INPUT.getMessage(), telegramClient);
        }
    }

    private void handleDeadlineStep(TaskCreationState state) {
        String deadlineStr = requestText.trim();
        // Validate date format YYYY-MM-DD
        if (!deadlineStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
            BotHelper.sendMessageToTelegram(chatId, "Invalid date format. Use YYYY-MM-DD", telegramClient);
            return;
        }
        state.setDeadline(deadlineStr);
        state.nextStep();
        // Send status keyboard
        ReplyKeyboardMarkup statusKeyboard = ReplyKeyboardMarkup.builder()
            .resizeKeyboard(true)
            .oneTimeKeyboard(true)
            .keyboardRow(new KeyboardRow(BotLabels.STATUS_OPEN.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.STATUS_IN_PROGRESS.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.STATUS_CLOSED.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.CANCEL.getLabel()))
            .build();
        BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_PROMPT_STATUS.getMessage(), telegramClient, statusKeyboard);
    }

    private void handleStatusStep(TaskCreationState state) {
        String status = mapStatusLabel(requestText.trim());
        if (status == null) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_INVALID_INPUT.getMessage(), telegramClient);
            return;
        }
        state.setStatus(status);
        state.nextStep();
        BotHelper.sendMessageToTelegram(chatId, BotMessages.CREATE_TASK_PROMPT_SPRINT.getMessage(), telegramClient);
    }

    private void handleSprintStep(TaskCreationState state) {
        String input = requestText.trim().toLowerCase();
        if (input.equals("skip")) {
            state.setSprint(0);
        } else {
            try {
                int sprint = Integer.parseInt(input);
                if (sprint < 0 || sprint > 5) {
                    BotHelper.sendMessageToTelegram(chatId, "Sprint must be 0-5 or 'skip'", telegramClient);
                    return;
                }
                state.setSprint(sprint);
            } catch (NumberFormatException e) {
                BotHelper.sendMessageToTelegram(chatId, "Sprint must be 0-5 or 'skip'", telegramClient);
                return;
            }
        }
        state.nextStep();
        finalizeTaskCreation(state);
    }

    private void finalizeTaskCreation(TaskCreationState state) {
        if (telegramUserId == null) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.TELEGRAM_ACCOUNT_NOT_LINKED.getMessage(), telegramClient);
            taskCreationStates.remove(chatId);
            return;
        }

        if (!taskService.isTelegramUserLinked(telegramUserId)) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.TELEGRAM_ACCOUNT_NOT_LINKED.getMessage(), telegramClient);
            taskCreationStates.remove(chatId);
            return;
        }

        if (!taskService.isTelegramUserDeveloper(telegramUserId)) {
            BotHelper.sendMessageToTelegram(chatId, BotMessages.TELEGRAM_USER_NOT_DEVELOPER.getMessage(), telegramClient);
            taskCreationStates.remove(chatId);
            return;
        }

        try {
            Task createdTask = taskService.createTaskFromBotWithAllFields(state, telegramUserId);
            String successMsg = BotMessages.CREATE_TASK_SUCCESS.getMessage()
                .replace("{taskId}", String.valueOf(createdTask.getTaskID()))
                .replace("{taskName}", createdTask.getName())
                .replace("{status}", createdTask.getStatus());
            BotHelper.sendMessageToTelegram(chatId, successMsg, telegramClient);
        } catch (Exception e) {
            logger.error("Error creating task from bot", e);
            BotHelper.sendMessageToTelegram(chatId, "Error creating task: " + e.getMessage(), telegramClient);
        } finally {
            taskCreationStates.remove(chatId);
        }
    }

    private String mapTaskTypeLabel(String label) {
        if (label.equals(BotLabels.TYPE_NEW_FEATURE.getLabel())) return "new-feature";
        if (label.equals(BotLabels.TYPE_BUG_FIX.getLabel())) return "bug-fixed";
        if (label.equals(BotLabels.TYPE_DOCUMENTATION.getLabel())) return "documentation";
        if (label.equals(BotLabels.TYPE_REVIEW.getLabel())) return "review";
        if (label.equals(BotLabels.TYPE_IMPROVEMENT.getLabel())) return "improved-feature";
        return null;
    }

    private String mapPriorityLabel(String label) {
        if (label.equals(BotLabels.PRIORITY_LOW.getLabel())) return "LOW";
        if (label.equals(BotLabels.PRIORITY_MEDIUM.getLabel())) return "MEDIUM";
        if (label.equals(BotLabels.PRIORITY_HIGH.getLabel())) return "HIGH";
        return null;
    }

    private String mapStatusLabel(String label) {
        if (label.equals(BotLabels.STATUS_OPEN.getLabel())) return "open";
        if (label.equals(BotLabels.STATUS_IN_PROGRESS.getLabel())) return "in_progress";
        if (label.equals(BotLabels.STATUS_CLOSED.getLabel())) return "closed";
        return null;
    }

    private Integer parseSummaryWindow(String commandText) {
        String[] parts = commandText.split("\\s+");
        if (parts.length == 1) {
            return DEFAULT_SUMMARIZE_WINDOW;
        }
        if (parts.length != 2) {
            return null;
        }

        try {
            return Integer.parseInt(parts[1]);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String formatSummaryReply(TelegramSummary summary) {
        return "Summary\n"
            + valueOrNone(summary.getSummaryText())
            + "\n\nDecisions\n"
            + valueOrNone(summary.getDecisionsText())
            + "\n\nAction Items\n"
            + valueOrNone(summary.getActionItemsText());
    }

    private String valueOrNone(String value) {
        if (value == null || value.isBlank()) {
            return "None identified";
        }
        return value;
    }


}
