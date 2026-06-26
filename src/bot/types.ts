import { Context, Scenes } from 'telegraf';

export interface MyWizardSession extends Scenes.WizardSessionData {}

// Define custom session data
export interface MySession extends Scenes.WizardSession<MyWizardSession> {
  user?: any;
  resumeId?: number;
  rs?: any; // Resume state for the wizard
}

// Define context type
export interface MyContext extends Context {
  session: MySession;
  scene: Scenes.SceneContextScene<MyContext, MyWizardSession>;
  wizard: Scenes.WizardContextWizard<MyContext>;
}
