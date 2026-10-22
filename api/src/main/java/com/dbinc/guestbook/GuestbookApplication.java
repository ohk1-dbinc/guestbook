package com.dbinc.guestbook;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GuestbookApplication {

  public static void main(String[] args) throws IOException {
    // SQLite는 폴더를 만들어 주지 않으므로 기본 DB 폴더를 먼저 만듦
    Files.createDirectories(Path.of("data"));
    SpringApplication.run(GuestbookApplication.class, args);
  }

}
