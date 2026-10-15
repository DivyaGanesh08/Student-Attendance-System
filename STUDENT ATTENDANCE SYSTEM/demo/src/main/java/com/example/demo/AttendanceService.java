package com.example.demo;


import com.example.demo.Student;
import com.example.demo.Attendance;
import com.example.demo.StudentRepository;
import com.example.demo.AttendanceRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AttendanceService {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;

    public AttendanceService(
            StudentRepository studentRepository,
            AttendanceRepository attendanceRepository) {

        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    // Add student
    public Student addStudent(Student student) {

        if (student.getName() == null
                || student.getName().isBlank()
                || student.getEmail() == null
                || student.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Student name and email are required");
        }

        student.setName(student.getName().trim());
        student.setEmail(
                student.getEmail().trim().toLowerCase());

        if (studentRepository.existsByEmailIgnoreCase(
                student.getEmail())) {
            throw new IllegalArgumentException(
                    "Student email already exists");
        }

        return studentRepository.save(student);
    }

    // Get all students
    public List<Student> getStudents() {
        return studentRepository.findAll();
    }

    // Mark attendance
    public Attendance markAttendance(
            Long studentId,
            String status,
            LocalDate date) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student not found"));

        if (status == null) {
            throw new IllegalArgumentException(
                    "Status is required");
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!normalizedStatus.equals("PRESENT")
                && !normalizedStatus.equals("ABSENT")) {
            throw new IllegalArgumentException(
                    "Status must be PRESENT or ABSENT");
        }

        LocalDate attendanceDate =
                date == null ? LocalDate.now() : date;

        if (attendanceRepository
                .existsByStudentIdAndAttendanceDate(
                        studentId, attendanceDate)) {
            throw new IllegalArgumentException(
                    "Attendance already marked for this date");
        }

        Attendance attendance = new Attendance(
                student, attendanceDate, normalizedStatus);

        return attendanceRepository.save(attendance);
    }

    // Get all attendance
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    // Get attendance of one student
    public List<Attendance> getStudentAttendance(Long studentId) {

        if (!studentRepository.existsById(studentId)) {
            throw new IllegalArgumentException(
                    "Student not found");
        }

        return attendanceRepository
                .findByStudentIdOrderByAttendanceDateDesc(
                        studentId);
    }

    // Calculate attendance percentage
    public double getAttendancePercentage(Long studentId) {

        if (!studentRepository.existsById(studentId)) {
            throw new IllegalArgumentException(
                    "Student not found");
        }

        long total =
                attendanceRepository.countByStudentId(studentId);

        if (total == 0) {
            return 0.0;
        }

        long present =
                attendanceRepository
                        .countByStudentIdAndStatusIgnoreCase(
                                studentId, "PRESENT");

        return Math.round(
                (present * 10000.0) / total) / 100.0;
    }
}