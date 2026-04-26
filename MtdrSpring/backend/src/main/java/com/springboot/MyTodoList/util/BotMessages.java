package com.springboot.MyTodoList.util;

public enum BotMessages {
	
	HELLO_MYTODO_BOT(
	"👋 Hello! I'm Synkra Bot!\nType a new todo item below and press the send button (blue arrow), or select an option below:"),
	BOT_REGISTERED_STARTED("🤖 Bot registered and started successfully!"),
	ITEM_DONE("✅ Item done! Select /todolist to return to the list of todo items, or /start to go to the main screen."), 
	ITEM_UNDONE("Item undone! Select /todolist to return to the list of todo items, or /start to go to the main screen."), 
	ITEM_DELETED(" Item deleted! Select /todolist to return to the list of todo items, or /start to go to the main screen."),
	TYPE_NEW_TODO_ITEM("Type a new todo item below and press the send button (blue arrow) on the right-hand side."),
	TASK_ADDED("✅ Task created in database successfully."),
	TASK_ADD_USAGE("Use /addtask <task name>. Example: /addtask Fix login endpoint"),
	TASK_ADD_FAILED("Task could not be created in database. Check bot.task.defaultProjectId and bot.task.defaultDeveloperId."),
	TELEGRAM_ACCOUNT_NOT_LINKED("Your Telegram account is not linked to an app user yet. Ask the admin to add your mapping in telegram_account."),
	TELEGRAM_USER_NOT_DEVELOPER("Your linked account is not registered as a developer, so no developer tasks can be shown."),
	SUMMARIZE_USAGE("Use /summarize or /summarize <N>. Example: /summarize 20"),
	SUMMARIZE_INVALID_RANGE("The summary window must be between 5 and 30 messages."),
	SUMMARIZE_NO_MESSAGES("There are no stored messages in this chat to summarize yet."),
	SUMMARIZE_FAILED("⚠️ I couldn't generate the summary right now. Please try again later."),
	PENDING_TASKS_EMPTY("No pending tasks found."),
	CREATE_TASK_START("Let's create a new task for you! \n\nStep 1/9: What is the task name?"),
	CREATE_TASK_PROMPT_DESCRIPTION("Step 2/9: Describe the task (brief description):"),
	CREATE_TASK_PROMPT_PROJECT("Step 3/9: Enter project ID:"),
	CREATE_TASK_PROMPT_TYPE("Step 4/9: Select task type:"),
	CREATE_TASK_PROMPT_PRIORITY("Step 5/9: Select priority level:"),
	CREATE_TASK_PROMPT_ESTIMATED_TIME("Step 6/9: Estimated time in hours:"),
	CREATE_TASK_PROMPT_DEADLINE("Step 7/9: Enter deadline date (format: YYYY-MM-DD):"),
	CREATE_TASK_PROMPT_STATUS("Step 8/9: Select task status:"),
	CREATE_TASK_PROMPT_SPRINT("Step 9/9: Enter sprint number (0-5):"),
	CREATE_TASK_SUCCESS("✅ Task created successfully!\n\nTask ID: {taskId}\nName: {taskName}\nStatus: {status}"),
	CREATE_TASK_CANCELLED("❌ Task creation cancelled."),
	CREATE_TASK_INVALID_INPUT("Invalid input. Please try again."),
	BYE("👋 Bye! Select /start to resume!");

	private String message;

	BotMessages(String enumMessage) {
		this.message = enumMessage;
	}

	public String getMessage() {
		return message;
	}

}
