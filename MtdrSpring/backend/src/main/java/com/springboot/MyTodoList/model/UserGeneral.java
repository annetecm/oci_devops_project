package com.springboot.MyTodoList.model;

import jakarta.persistence.*;

@Entity
@Table(name = "USERGENERAL")
public class UserGeneral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USERID")
    private Integer userId;

    @Column(name = "PHONE")
    private String phone;

    @Column(name = "EMAIL")
    private String email;

    @Column(name = "NAME")
    private String name;

    @Column(name = "LASTNAME")
    private String lastName;

    @Column(name = "PASSWORD")
    private String password;

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
