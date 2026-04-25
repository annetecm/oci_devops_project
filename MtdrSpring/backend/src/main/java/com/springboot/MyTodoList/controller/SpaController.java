package com.springboot.MyTodoList.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards all unmatched routes to index.html so React Router can handle
 * client-side navigation (e.g. /manager, /developer/:id).
 */
@Controller
public class SpaController {

    @GetMapping({
        "/manager",
        "/manager/**",
        "/developer",
        "/developer/**",
        "/developer/{developerId}",
        "/developer/task/{taskId}"
    })
    public String spa() {
        return "forward:/index.html";
    }
}
