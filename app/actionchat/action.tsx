import React from 'react';
import { createAI, getMutableAIState, createStreamableUI } from 'ai/rsc';
import { streamText } from 'ai';
import { Box, Typography, CircularProgress } from '@mui/material';
import { BotMessage, UserMessage } from './component/botmessage';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { saveChatToRedis } from './lib/redis';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { getUserInfo, getSession } from '@/lib/server/supabase';
import { redis } from '@/lib/server/server';

const SYSTEM_TEMPLATE = `You are a helpful assistant. Answer all questions to the best of your ability. Provide helpful answers in markdown.`;

const getModel = (selectedModel: 'claude3' | 'chatgpt4') => {
  if (selectedModel === 'claude3') {
    return anthropic('claude-3-5-sonnet-20240620');
  } else if (selectedModel === 'chatgpt4') {
    return openai('gpt-4o');
  }
  return anthropic('claude-3-5-sonnet-20240620');
};

async function submitMessage(
  currentUserMessage: string,
  model_select: 'claude3' | 'chatgpt4',
  chatId: string
): Promise<SubmitMessageResult> {
  'use server';

  const CurrentChatSessionId = chatId || uuidv4();

  const aiState = getMutableAIState<typeof AI>();

  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0
    };
  }
  const userInfo = await getUserInfo(session.id);
  if (!userInfo) {
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0
    };
  }

  // Update AI state with new message.
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);

  const uiStream = createStreamableUI(
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2,
        p: 2,
        borderRadius: 4,
        bgcolor: 'grey.100',
        backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
        boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
        transition: 'background-color 0.3s ease',

        ':hover': {
          bgcolor: 'grey.200'
        }
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: 'textSecondary',
          fontStyle: 'italic'
        }}
      >
        Searching...
      </Typography>
    </Box>
  );

  (async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Found relevant website. Scraping data...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Analyzing scraped data...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Generating response...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    const result = await streamText({
      model: getModel(model_select),
      maxTokens: 4000,
      temperature: 0,
      frequencyPenalty: 0.5,
      system: SYSTEM_TEMPLATE,
      messages: [
        ...aiState.get().map((info) => ({
          role: info.role,
          content: info.content,
          name: info.name
        }))
      ],
      onFinish: async (event) => {
        const { text, usage } = event;
        const { promptTokens, completionTokens, totalTokens } = usage;
        console.log('Prompt Tokens:', promptTokens);
        console.log('Completion Tokens:', completionTokens);
        console.log('Total Tokens:', totalTokens);
        await saveChatToRedis(
          CurrentChatSessionId,
          session.id,
          currentUserMessage,
          text
        );

        aiState.done([
          ...aiState.get(),
          { role: 'assistant', content: fullResponse }
        ]);
        /*  If you want to track the usage of the AI model, you can use the following code:'
      import { track } from '@vercel/analytics/server';
        track('ailoven', {
          systemPromptTemplate,
          currnetUserMessage,
          fullResponse: text,
          promptTokens,
          completionTokens,
          totalTokens
        });
      }
      Check out Vercel track functionallity
          */
      }
    });

    let fullResponse = '';
    for await (const textDelta of result.textStream) {
      fullResponse += textDelta;
      uiStream.update(<BotMessage>{fullResponse}</BotMessage>);
    }

    uiStream.done();
  })();
  return {
    id: Date.now(),
    display: uiStream.value,
    chatId: CurrentChatSessionId
  };
}

type MessageFromDB = {
  id: string;
  prompt: string[];
  completion: string[];
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

async function ChatHistoryUpdate(
  full_name: string,
  chatId: string
): Promise<ChatHistoryUpdateResult> {
  'use server';
  const session = await getSession();
  if (!session) {
    return { uiMessages: [], chatId: '' };
  }

  const chatKey = `chat:${chatId}-user:${session.id}`;
  let metadata: Omit<MessageFromDB, 'prompt' | 'completion'> | null = null;
  let prompts: string[] = [];
  let completions: string[] = [];

  try {
    const pipeline = redis.pipeline();
    pipeline.hgetall(chatKey);
    pipeline.lrange(`${chatKey}:prompts`, 0, -1);
    pipeline.lrange(`${chatKey}:completions`, 0, -1);

    const [metadataResult, promptsResult, completionsResult] =
      await pipeline.exec();

    metadata = metadataResult as Omit<
      MessageFromDB,
      'prompt' | 'completion'
    > | null;
    prompts = promptsResult as string[];
    completions = completionsResult as string[];
  } catch (error) {
    console.error('Error fetching chat data from Redis:', error);
  }

  const chatData: MessageFromDB = {
    id: chatId,
    prompt: prompts,
    completion: completions,
    user_id: session.id,
    created_at: metadata?.created_at
      ? format(new Date(metadata.created_at), 'dd-MM-yyyy HH:mm')
      : '',
    updated_at: metadata?.updated_at
      ? format(new Date(metadata.updated_at), 'dd-MM-yyyy HH:mm')
      : ''
  };

  const userMessages = chatData.prompt;
  const assistantMessages = chatData.completion;
  const combinedMessages: {
    role: 'user' | 'assistant';
    id: string;
    content: string;
  }[] = [];

  for (
    let i = 0;
    i < Math.max(userMessages.length, assistantMessages.length);
    i++
  ) {
    if (userMessages[i]) {
      combinedMessages.push({
        role: 'user',
        id: `user-${i}`,
        content: userMessages[i]
      });
    }
    if (assistantMessages[i]) {
      combinedMessages.push({
        role: 'assistant',
        id: `assistant-${i}`,
        content: assistantMessages[i]
      });
    }
  }

  const aiState = getMutableAIState<typeof AI>();
  const aiStateMessages: ServerMessage[] = combinedMessages.map((message) => ({
    role: message.role,
    content: message.content
  }));
  aiState.done(aiStateMessages);

  const uiMessages: ClientMessage[] = combinedMessages.map((message) => {
    if (message.role === 'user') {
      return {
        id: message.id,
        role: 'user',
        display: (
          <UserMessage full_name={full_name}>{message.content}</UserMessage>
        ),
        chatId: chatId
      };
    } else {
      return {
        id: message.id,
        role: 'assistant',
        display: <BotMessage>{message.content}</BotMessage>,
        chatId: chatId
      };
    }
  });

  return { uiMessages, chatId };
}

type ResetResult = {
  success: boolean;
  message: string;
};
async function resetMessages(): Promise<ResetResult> {
  'use server';

  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: 'Error: User not found. Please try again later.'
    };
  }

  const aiState = getMutableAIState<typeof AI>();

  try {
    // Clear all messages from the AI state

    // Clear all messages from the AI state by setting it to an empty array
    aiState.update([]);

    // Call done to finalize the state update
    aiState.done([]);

    return {
      success: true,
      message: 'Conversation reset successfully.'
    };
  } catch (error) {
    console.error('Error resetting chat messages:', error);
    return {
      success: false,
      message:
        'Error resetting chat messages. Please try again later or contact support.'
    };
  }
}
type ServerMessage = {
  role: 'user' | 'assistant';
  content: string;
  name?: string;
};

export type ClientMessage = {
  id: string | number | null;
  role: 'user' | 'assistant';
  display: React.ReactNode;
  chatId?: string | null;
};

const initialAIState: ServerMessage[] = [];
const initialUIState: ClientMessage[] = [];

export type SubmitMessageResult = {
  success?: boolean;
  message?: string;
  limit?: number;
  remaining?: number;
  reset?: number;
  id?: number;
  display?: React.ReactNode;
  chatId?: string;
};

export type ChatHistoryUpdateResult = {
  uiMessages: ClientMessage[];
  chatId: string;
};

type Actions = {
  submitMessage: (
    currentUserMessage: string,
    model_select: 'claude3' | 'chatgpt4',
    chatId: string
  ) => Promise<SubmitMessageResult>;
  ChatHistoryUpdate: (
    full_name: string,
    chatId: string
  ) => Promise<ChatHistoryUpdateResult>;
  resetMessages: () => Promise<ResetResult>;
};

export const AI = createAI<ServerMessage[], ClientMessage[], Actions>({
  actions: {
    submitMessage,
    ChatHistoryUpdate,
    resetMessages
  },
  initialUIState,
  initialAIState
});
