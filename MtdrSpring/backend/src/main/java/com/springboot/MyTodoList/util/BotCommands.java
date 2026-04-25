package com.springboot.MyTodoList.util;

public enum BotCommands {

	START_COMMAND("/start"), 
	HIDE_COMMAND("/hide"), 
	TODO_LIST("/todolist"),
	WHO_AM_I("/whoami"),
	PENDING_TASKS("/pendingtasks"),
	ADD_ITEM("/additem"),
	ADD_TASK("/addtask"),
	CREATE_TASK("/createtask"),
	LLM_REQ("/llm");

	private String command;

	BotCommands(String enumCommand) {
		this.command = enumCommand;
	}

	public String getCommand() {
		return command;
	}
}
