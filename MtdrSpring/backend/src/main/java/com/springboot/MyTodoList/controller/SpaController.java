package com.springboot.MyTodoList.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all unmatched routes to index.html so React Router can handle
 * client-side navigation (e.g. /manager, /developer/:id).
 */
@Controller
public class SpaController {

    @RequestMapping(value = {
        "/manager",
        "/manager/**",
        "/developer",
        "/developer/**"
    })
    public String spa() {
        return "forward:/index.html";
    }
}
