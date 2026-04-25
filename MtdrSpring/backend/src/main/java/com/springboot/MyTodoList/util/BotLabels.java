package com.springboot.MyTodoList.util;

public enum BotLabels {
	
	SHOW_MAIN_SCREEN("Show Main Screen"), 
	HIDE_MAIN_SCREEN("Hide Main Screen"),
	LIST_ALL_ITEMS("List All Items"), 
	PENDING_TASKS("Pending Tasks"),
	DASH("-"),
	
	// Task Type options
	TYPE_NEW_FEATURE("New Feature"),
	TYPE_BUG_FIX("Bug Fix"),
	TYPE_DOCUMENTATION("Documentation"),
	TYPE_REVIEW("Review"),
	TYPE_IMPROVEMENT("Improvement"),
	
	// Priority options
	PRIORITY_LOW("🟢 LOW"),
	PRIORITY_MEDIUM("🟡 MEDIUM"),
	PRIORITY_HIGH("🔴 HIGH"),
	
	// Status options
	STATUS_OPEN("Open"),
	STATUS_IN_PROGRESS("In Progress"),
	STATUS_CLOSED("Closed"),
	
	// Actions
	CREATE_TASK("Create Task"),
	CANCEL("Cancel");

	private String label;

	BotLabels(String enumLabel) {
		this.label = enumLabel;
	}

	public String getLabel() {
		return label;
	}

}
