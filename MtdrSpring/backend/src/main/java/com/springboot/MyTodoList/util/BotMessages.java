package com.springboot.MyTodoList.util;

public enum BotMessages {
	
	HELLO_MYTODO_BOT(
	"Hello! I'm Synkra Bot!\nType a new todo item below and press the send button (blue arrow), or select an option below:"),
	BOT_REGISTERED_STARTED("Bot registered and started succesfully!"),
	ITEM_DONE("Item done! Select /todolist to return to the list of todo items, or /start to go to the main screen."), 
	ITEM_UNDONE("Item undone! Select /todolist to return to the list of todo items, or /start to go to the main screen."), 
	ITEM_DELETED("Item deleted! Select /todolist to return to the list of todo items, or /start to go to the main screen."),
	TYPE_NEW_TODO_ITEM("Type a new todo item below and press the send button (blue arrow) on the rigth-hand side."),
	NEW_ITEM_ADDED("New item added! Select /todolist to return to the list of todo items, or /start to go to the main screen."),
	TASK_ADDED("Task created in database successfully."),
	TASK_ADD_USAGE("Use /addtask <task name>. Example: /addtask Fix login endpoint"),
	TASK_ADD_FAILED("Task could not be created in database. Check bot.task.defaultProjectId and bot.task.defaultDeveloperId."),
	TELEGRAM_ACCOUNT_NOT_LINKED("Your Telegram account is not linked to an app user yet. Ask the admin to add your mapping in telegram_account."),
	TELEGRAM_USER_NOT_DEVELOPER("Your linked account is not registered as a developer, so no developer tasks can be shown."),
	PENDING_TASKS_EMPTY("No pending tasks found."),
	CREATE_TASK_START("Let's create a new task for you! \n\nStep 1/9: What is the task name?"),
	CREATE_TASK_PROMPT_DESCRIPTION("Step 2/9: Describe the task (brief description):"),
	CREATE_TASK_PROMPT_PROJECT("Step 3/9: Enter project ID:"),
	CREATE_TASK_PROMPT_TYPE("Step 4/9: Select task type:"),
	CREATE_TASK_PROMPT_PRIORITY("Step 5/9: Select priority level:"),
	CREATE_TASK_PROMPT_ESTIMATED_TIME("Step 6/9: Estimated time in hours:"),
	CREATE_TASK_PROMPT_DEADLINE("Step 7/9: Enter deadline date (format: YYYY-MM-DD):"),
	CREATE_TASK_PROMPT_STATUS("Step 8/9: Select task status:"),
	CREATE_TASK_PROMPT_SPRINT("(Step 9/9 Enter sprint number (0-5) or type 'skip' to finish:"),
	CREATE_TASK_SUCCESS("Task created successfully!\n\nTask ID: {taskId}\nName: {taskName}\nStatus: {status}"),
	CREATE_TASK_CANCELLED("Task creation cancelled."),
	CREATE_TASK_INVALID_INPUT("Invalid input. Please try again."),
	BYE("Bye! Select /start to resume!");

	private String message;

	BotMessages(String enumMessage) {
		this.message = enumMessage;
	}

	public String getMessage() {
		return message;
	}

}
