export class AuthResponseDto {
  accessToken: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string | null;
    role: string;
    departmentId: number | null;
  };
}
