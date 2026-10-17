import { IsString, IsNotEmpty, IsEmail, Matches, MaxLength } from 'class-validator';
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from '../../common/password';

export class RegisterOrgDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  adminName: string;

  @IsEmail()
  adminEmail: string;

  // This becomes the login password for the System Admin account this registration
  // provisions for adminEmail — see OrganizationsService#register.
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_RULE_MESSAGE })
  password: string;

  @IsString()
  @IsNotEmpty()
  subscriptionPlanId: string;

  // Proof documents uploaded as data URLs (same approach as procurement PO/invoice files)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  adminProofFileName: string;

  @IsString()
  @Matches(/^(application\/pdf|image\/png|image\/jpeg)$/, { message: 'Admin proof must be a PDF, PNG or JPG file.' })
  adminProofFileType: string;

  @IsString()
  @MaxLength(8_000_000, { message: 'Admin proof file is too large (max 5 MB).' })
  @Matches(/^data:/, { message: 'Admin proof file is invalid.' })
  adminProofFileDataUrl: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  orgProofFileName: string;

  @IsString()
  @Matches(/^(application\/pdf|image\/png|image\/jpeg)$/, { message: 'Organization details proof must be a PDF, PNG or JPG file.' })
  orgProofFileType: string;

  @IsString()
  @MaxLength(8_000_000, { message: 'Organization details file is too large (max 5 MB).' })
  @Matches(/^data:/, { message: 'Organization details file is invalid.' })
  orgProofFileDataUrl: string;
}
