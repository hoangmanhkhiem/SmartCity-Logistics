import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        tokenType: string;
        user: {
            id: string;
            name: string;
            createdAt: Date;
            email: string;
            phone: string;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        tokenType: string;
        user: {
            memberships: ({
                role: {
                    rolePermissions: ({
                        permission: {
                            id: string;
                            name: string;
                            description: string | null;
                            createdAt: Date;
                            updatedAt: Date;
                            resource: string;
                            action: string;
                        };
                    } & {
                        id: string;
                        createdAt: Date;
                        roleId: string;
                        permissionId: string;
                    })[];
                } & {
                    id: string;
                    name: string;
                    displayName: string | null;
                    description: string | null;
                    isSystem: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
                organization: {
                    id: string;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string | null;
                    phone: string | null;
                    isActive: boolean;
                    type: string;
                    business: string | null;
                    address: string | null;
                    website: string | null;
                    logoUrl: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                roleId: string;
                isDefault: boolean;
                userId: string;
                organizationId: string;
            })[];
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
        };
    }>;
}
