package life.arch.common.utils;

import com.github.f4b6a3.ulid.UlidCreator;

import java.util.UUID;

public final class IdGenerator {

    private IdGenerator() {
    }

    /**
     * Generates a Monotonic ULID and converts it to a standard Java UUID.
     */
    public static UUID generateUlidAsUuid() {
        return UlidCreator.getMonotonicUlid().toUuid();
    }
}