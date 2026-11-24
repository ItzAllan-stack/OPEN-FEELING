import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Small offline repository check. It reads project configuration only and
 * never connects to Firebase or prints environment values.
 */
public final class ProjectHealthCheck {
    private static final List<String> REQUIRED_FILES = List.of(
        "package.json",
        "src/App.tsx",
        "src/services/firestoreService.ts",
        "firestore.rules",
        ".github/workflows/ci.yml"
    );

    private ProjectHealthCheck() {}

    public static void main(String[] args) throws Exception {
        Path root = args.length == 0 ? Path.of(".") : Path.of(args[0]);
        int failures = 0;

        for (String file : REQUIRED_FILES) {
            if (Files.isRegularFile(root.resolve(file))) {
                System.out.println("OK      " + file);
            } else {
                System.err.println("MISSING " + file);
                failures++;
            }
        }

        Path rulesPath = root.resolve("firestore.rules");
        if (Files.isRegularFile(rulesPath)) {
            String rules = Files.readString(rulesPath);
            if (rules.contains("allow read, write: if false;")) {
                System.out.println("OK      Firestore default-deny rule found");
            } else {
                System.err.println("MISSING Firestore default-deny rule");
                failures++;
            }
        }

        Path workflowPath = root.resolve(".github/workflows/ci.yml");
        if (Files.isRegularFile(workflowPath)) {
            String workflow = Files.readString(workflowPath);
            if (workflow.contains("pull_request:")) {
                System.out.println("OK      CI runs for pull requests");
            } else {
                System.err.println("MISSING pull_request CI trigger");
                failures++;
            }
        }

        if (failures > 0) {
            System.err.println("Project check failed with " + failures + " issue(s).");
            System.exit(1);
        }
        System.out.println("Project structure checks passed.");
    }
}
