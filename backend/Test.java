import io.minio.GetPresignedObjectUrlArgs;
import io.minio.http.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class Test {
    public static void main(String[] args) {
        Map<String, String> queryParams = new HashMap<>();
        queryParams.put("response-content-disposition", "attachment; filename=\"test.png\"");
        
        GetPresignedObjectUrlArgs args1 = GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket("test")
                .object("test.png")
                .expiry(1, TimeUnit.HOURS)
                .extraQueryParams(queryParams)
                .build();
                
        System.out.println(args1.extraQueryParams());
    }
}
