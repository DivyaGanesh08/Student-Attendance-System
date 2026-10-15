package com.example.demo;


import com.example.demo.Student;
import com.example.demo.AttendanceService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final AttendanceService attendanceService;

    public StudentController(
            AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Student addStudent(@RequestBody Student student) {
        return attendanceService.addStudent(student);
    }

    @GetMapping
    public List<Student> getStudents() {
        return attendanceService.getStudents();
    }
}