export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="border-l-4 border-green-500 pl-3 text-green-600">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="border-l-4 border-red-500 pl-3 text-red-600">
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div className="border-l-4 border-gray-400 pl-3 text-gray-600">{message.message}</div>
      )}
    </div>
  );
}
