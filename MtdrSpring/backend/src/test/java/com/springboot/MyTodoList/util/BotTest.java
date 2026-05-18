
package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.GeminiService;
import com.springboot.MyTodoList.service.TaskService;
import com.springboot.MyTodoList.service.TelegramMessageService;
import com.springboot.MyTodoList.service.TelegramSummaryService;
import com.springboot.MyTodoList.service.ToDoItemService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import java.util.List;

import jakarta.validation.constraints.Null;


class BotTest {

    // Declare the mocks
    private TelegramClient mockTelegramClient;
    private ToDoItemService mockTodoService;
    private TaskService mockTaskService;
    private GeminiService mockGeminiService;
    private TelegramMessageService mockTelegramMessageService;
    private TelegramSummaryService mockTelegramSummaryService;

    // We are testing the following class which has the bot logic
    private BotActions botActions;

    @BeforeEach
    void setUp() {
        // Create fresh mocks before each test
        mockTelegramClient = mock(TelegramClient.class);
        mockTodoService = mock(ToDoItemService.class);
        mockTaskService = mock(TaskService.class);
        mockGeminiService = mock(GeminiService.class);
        mockTelegramMessageService = mock(TelegramMessageService.class);
        mockTelegramSummaryService = mock(TelegramSummaryService.class);

        // Create the real BotActions, injecting the mocks
        botActions = new BotActions(
            mockTelegramClient,
            mockTodoService,
            mockTaskService,
            mockGeminiService,
            mockTelegramMessageService,
            mockTelegramSummaryService
        );

        // Set a fake chat ID and a fake linked developer user
        botActions.setChatId(123456L);
        botActions.setTelegramUserId(999L);

        //clean any state from previous tests
        botActions.setRequestText("Cancel");
        botActions.fnCreateTask();
        botActions.exit = false;

        // By default, pretend the user is a linked developer so auth checks pass
        when(mockTaskService.isTelegramUserLinked(999L)).thenReturn(true);
        when(mockTaskService.isTelegramUserDeveloper(999L)).thenReturn(true);
    }

    // ----------------------------- FnCreateTask TESTS ------------------

    // /createtask starts flow but does NOT call createTaskFromBot
    @Test
    void testFnCreateTask_startsFlow_onCommand() throws Exception {
        botActions.setRequestText("/createtask");

        botActions.fnCreateTask();

        // Task creation should NOT be triggered at this point
        verify(mockTaskService, never()).createTaskFromBotWithAllFields(any(), anyLong());
        assertTrue(botActions.exit, "exit flag should be true after starting the flow");
    }

    // Full creation path
    @Test
    void testFnCreateTask_fullFlow_createsTask() throws Exception {
        Task fakeTask = new Task();
        fakeTask.setTaskID(42);
        fakeTask.setName("Fix login bug");
        fakeTask.setStatus("open");
        when(mockTaskService.createTaskFromBotWithAllFields(any(TaskCreationState.class), any(Long.class)))
            .thenReturn(fakeTask);

        botActions.setRequestText("/createtask");
        botActions.fnCreateTask();
        botActions.exit = false;

        // step 1: name
        botActions.setRequestText("Fix login bug");
        botActions.fnCreateTask();
        botActions.exit = false;

        // step 2: description
        botActions.setRequestText("Users cannot log in with SSO");
        botActions.fnCreateTask();
        botActions.exit = false;

        // step 3: project ID
        botActions.setRequestText("1");
        botActions.fnCreateTask();
        botActions.exit = false;

        // step 4: task type (must exactly match BotLabels.TYPE_BUG_FIX)
        botActions.setRequestText("Bug Fix");
        botActions.fnCreateTask();
        botActions.exit = false;

        // step 5: priority (must exactly match BotLabels.PRIORITY_HIGH)
        botActions.setRequestText("🔴 HIGH");
        botActions.fnCreateTask();
        botActions.exit = false;

        // step 6: estimated time in hours
        botActions.setRequestText("4");
        botActions.fnCreateTask();
        botActions.exit = false;

        // step 7: deadline
        botActions.setRequestText("2025-12-31");
        botActions.fnCreateTask();
        botActions.exit = false;

        // step 8: status (must exactly match BotLabels.STATUS_OPEN)
        botActions.setRequestText("Open");
        botActions.fnCreateTask();
        botActions.exit = false;

        // step 9: sprint 
        botActions.setRequestText("1");
        botActions.fnCreateTask();

        verify(mockTaskService).createTaskFromBotWithAllFields(
            any(TaskCreationState.class), any(Long.class));
        assertTrue(botActions.exit);
    }

    //Sending "Cancel" while a flow is active must stop the code and do not create a task
    @Test
    void testFnCreateTask_cancel_abortsFlow() throws Exception {
        // Start 
        botActions.setRequestText("/createtask");
        botActions.fnCreateTask();
        botActions.exit = false;

        // User cancels on step 1
        botActions.setRequestText("Cancel");
        botActions.fnCreateTask();

        verify(mockTaskService, never()).createTaskFromBotWithAllFields(any(), anyLong());
        assertTrue(botActions.exit, "exit should be true after cancellation");
    }

    //Random message should NOT trigger createTask
    @Test
    void testFnCreateTask_doesNothing_whenNoStateAndNoCommand() throws Exception {
        botActions.setRequestText("some random message");

        botActions.fnCreateTask();

        verify(mockTaskService, never()).createTaskFromBotWithAllFields(any(), anyLong());
        assertFalse(botActions.exit);
    }

    //If exit is already true, fnCreateTask must be a no-op.
    @Test
    void testFnCreateTask_doesNothing_whenExitAlreadyTrue() throws Exception {
        botActions.setRequestText("/createtask");
        botActions.exit = true;

        botActions.fnCreateTask();

        verify(mockTaskService, never()).createTaskFromBotWithAllFields(any(), anyLong());
    }

    // If the telegram user is not linked, task creation must be refused
    // even after providing all the data.
     
    @Test
    void testFnCreateTask_refusesCreation_whenUserNotLinked() throws Exception {
        // Override the default: user is NOT linked
        when(mockTaskService.isTelegramUserLinked(999L)).thenReturn(false);

        walkThroughAllSteps();

        verify(mockTaskService, never()).createTaskFromBotWithAllFields(any(), anyLong());
    }

    //If the linked user is not a developer, task creation must be refused.
    @Test
    void testFnCreateTask_refusesCreation_whenUserNotDeveloper() throws Exception {
        // User is linked but NOT a developer
        when(mockTaskService.isTelegramUserLinked(999L)).thenReturn(true);
        when(mockTaskService.isTelegramUserDeveloper(999L)).thenReturn(false);

        walkThroughAllSteps();

        verify(mockTaskService, never()).createTaskFromBotWithAllFields(any(), anyLong());
    }

    //An empty task name (blank string) on step 1 should not advance the step
    //and should not trigger task creation.
     
    @Test
    void testFnCreateTask_invalidInput_emptyTaskName() throws Exception {
        botActions.setRequestText("/createtask");
        botActions.fnCreateTask();
        botActions.exit = false;

        // Step 1 — send an empty name
        botActions.setRequestText("   ");
        botActions.fnCreateTask();

        verify(mockTaskService, never()).createTaskFromBotWithAllFields(any(), anyLong());
    }
    
     // Walks through all 9 steps to reach finalizeTaskCreation,
     // used by auth-failure tests.
  
    private void walkThroughAllSteps() throws Exception {
        String[] steps = {
            "/createtask",
            "My Task",
            "Some description",
            "1",
            "Bug Fix",
            "HIGH",
            "4",
            "2025-12-31",
            "Open",
            "1"
        };
        for (String step : steps) {
            botActions.setRequestText(step);
            botActions.fnCreateTask();
            botActions.exit = false;
        }
    }

    // ----------------------------------- fnPendingTasks -----------------------------------
    @Test
    // Verify that fnPendingTasks is returning the tasks the user has
    void testFnPendingTasks_returnsTasks() throws Exception {
        // Prepare a fake Task
        Task fakeTask = new Task();
        fakeTask.setTaskID(42);
        fakeTask.setName("Fix login bug");
        fakeTask.setStatus("open");

        when(mockTaskService.findPendingTasksByTelegramUserId(999L))
            .thenReturn(List.of(fakeTask));

        //Command
        botActions.setRequestText("/pendingtasks");

        botActions.fnPendingTasks();
    
        verify(mockTaskService).findPendingTasksByTelegramUserId(999L);

        assertTrue(botActions.exit);
    }

    // If the telegram user is not linked, pending tasks must be refused
    @Test
    void testFnPendingTasks_refuses_whenUserNotLinked() throws Exception {
        // Override the default: user is NOT linked
        when(mockTaskService.isTelegramUserLinked(999L)).thenReturn(false);

        botActions.setRequestText("/pendingtasks");

        botActions.fnPendingTasks();

        verify(mockTaskService, never()).findPendingTasksByTelegramUserId(999L);
        assertTrue(botActions.exit);
    }

    @Test
    void testFnPendingTasks_refuses_whenNullID() throws Exception {
        // Override the default: ID is null
        botActions.setTelegramUserId(null);

        botActions.setRequestText("/pendingtasks");

        botActions.fnPendingTasks();

        verify(mockTaskService, never()).findPendingTasksByTelegramUserId(any());
        assertTrue(botActions.exit);
    }

}