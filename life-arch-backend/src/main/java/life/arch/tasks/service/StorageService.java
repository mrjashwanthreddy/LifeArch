package life.arch.tasks.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Path;

public interface StorageService {
    String store(MultipartFile file) throws IOException;

    Path load(String filePath);

    void delete(String filePath) throws IOException;
}
