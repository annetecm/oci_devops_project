package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.UserGeneral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;
import java.util.Optional;

@Repository
@Transactional
public interface UserGeneralRepository extends JpaRepository<UserGeneral, Integer> {

    @Query(value = "SELECT * FROM USERGENERAL WHERE EMAIL = :email", nativeQuery = true)
    Optional<UserGeneral> findByEmail(@Param("email") String email);

    @Query(value = "SELECT DEVELOPERID FROM DEVELOPER WHERE USERID = :userId", nativeQuery = true)
    Integer findDeveloperIdByUserId(@Param("userId") Integer userId);

    @Query(value = "SELECT MANAGERID FROM PROJECTMANAGER WHERE USERID = :userId", nativeQuery = true)
    Integer findManagerIdByUserId(@Param("userId") Integer userId);
}
