package com.example.demo;


import com.example.demo.Attendance;
import com.example.demo.AttendanceService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(
            AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/mark")
    @ResponseStatus(HttpStatus.CREATED)
    public Attendance markAttendance(
            @RequestBody Map<String, String> body) {

        String idText = body.get("studentId");

        if (idText == null) {
            throw new IllegalArgumentException(
                    "studentId is required");
        }

        Long studentId;

        try {
            studentId = Long.parseLong(idText);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    "studentId must be a number");
        }

        String status = body.get("status");

        String dateText = body.get("attendanceDate");

        LocalDate date =
                dateText == null || dateText.isBlank()
                        ? LocalDate.now()
                        : LocalDate.parse(dateText);

        return attendanceService.markAttendance(
                studentId, status, date);
    }

    @GetMapping
    public List<Attendance> getAllAttendance() {
        return attendanceService.getAllAttendance();
    }

    @GetMapping("/student/{studentId}")
    public List<Attendance> getStudentAttendance(
            @PathVariable Long studentId) {
        return attendanceService.getStudentAttendance(studentId);
    }

    @GetMapping("/percentage/{studentId}")
    public Map<String, Object> getAttendancePercentage(
            @PathVariable Long studentId) {

        return Map.of(
                "studentId", studentId,
                "attendancePercentage",
                attendanceService.getAttendancePercentage(studentId)
        );
    }
}