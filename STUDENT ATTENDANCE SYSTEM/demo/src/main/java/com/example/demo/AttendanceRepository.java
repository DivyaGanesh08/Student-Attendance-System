package com.example.demo;


import com.example.demo.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDate;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    List<Attendance> findByStudentIdOrderByAttendanceDateDesc(
            Long studentId);

    boolean existsByStudentIdAndAttendanceDate(
            Long studentId, LocalDate attendanceDate);

    long countByStudentId(Long studentId);

    long countByStudentIdAndStatusIgnoreCase(
            Long studentId, String status);
}