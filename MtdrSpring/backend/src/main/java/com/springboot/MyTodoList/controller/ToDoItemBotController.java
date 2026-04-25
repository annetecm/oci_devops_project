package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.config.BotProps;
import com.springboot.MyTodoList.service.DeepSeekService;
import com.springboot.MyTodoList.service.TaskService;
import com.springboot.MyTodoList.service.TelegramMessageService;
import com.springboot.MyTodoList.service.TelegramSummaryService;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.util.BotActions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.longpolling.BotSession;
import org.telegram.telegrambots.longpolling.interfaces.LongPollingUpdateConsumer;
import org.telegram.telegrambots.longpolling.starter.AfterBotRegistration;
import org.telegram.telegrambots.longpolling.starter.SpringLongPollingBot;
import org.telegram.telegrambots.longpolling.util.LongPollingSingleThreadUpdateConsumer;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@Component
public class ToDoItemBotController  implements SpringLongPollingBot, LongPollingSingleThreadUpdateConsumer {

	private static final Logger logger = LoggerFactory.getLogger(ToDoItemBotController.class);
	private ToDoItemService toDoItemService;
	private TaskService taskService;
	private DeepSeekService deepSeekService;
	private TelegramMessageService telegramMessageService;
	private TelegramSummaryService telegramSummaryService;
	private final TelegramClient telegramClient;
	
	private final BotProps botProps;


	@Override
    public String getBotToken() {
		return botProps.getToken();
    }


	public ToDoItemBotController(
		BotProps bp,
		ToDoItemService tsvc,
		TaskService taskSvc,
		DeepSeekService ds,
		TelegramMessageService tms,
		TelegramSummaryService tss,
		TelegramClient telegramClient
	) {
		this.botProps = bp;
		this.telegramClient = telegramClient;
		toDoItemService = tsvc;
		taskService = taskSvc;
		deepSeekService = ds;
		telegramMessageService = tms;
		telegramSummaryService = tss;
	}

	@Override
    public LongPollingUpdateConsumer getUpdatesConsumer() {
        return this;
    }

	@Override
	public void consume(Update update) {

		if (!update.hasMessage() || !update.getMessage().hasText()) return;

		

		String messageTextFromTelegram = update.getMessage().getText();
		long chatId = update.getMessage().getChatId();
		Integer messageId = update.getMessage().getMessageId();
		Integer messageDate = update.getMessage().getDate();
		Long telegramUserId = update.getMessage().getFrom() != null ? update.getMessage().getFrom().getId() : null;
		if (!messageTextFromTelegram.trim().startsWith("/") && telegramUserId != null) {
			telegramMessageService.saveIncomingMessage(chatId, messageId, telegramUserId, messageTextFromTelegram, messageDate);
		}

		BotActions actions =  new BotActions(
			telegramClient,
			toDoItemService,
			taskService,
			deepSeekService,
			telegramMessageService,
			telegramSummaryService
		);
		actions.setRequestText(messageTextFromTelegram);
		actions.setChatId(chatId);
		actions.setTelegramUserId(telegramUserId);
		actions.setTelegramUsername(null);
		if(actions.getTodoService()==null){
			logger.info("todosvc error");
			actions.setTodoService(toDoItemService);
		}


		actions.fnStart();
		actions.fnHide();
		actions.fnWhoAmI();
		actions.fnPendingTasks();
		actions.fnCreateTask();
		actions.fnSummarize();
		actions.fnLLM();

	}

	@AfterBotRegistration
    public void afterRegistration(BotSession botSession) {
        System.out.println("Registered bot running state is: " + botSession.isRunning());
    }

}


