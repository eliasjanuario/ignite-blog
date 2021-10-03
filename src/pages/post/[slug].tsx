/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable react/no-danger */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';
import Comments from '../../components/Comments';

import styles from './post.module.scss';
import commomStyles from '../../styles/common.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
  preview: boolean;
}

export default function Post({
  post,
  navigation,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;
    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | Ignite Blog</title>
      </Head>

      <main>
        <Header />
        <img
          src={post.data.banner.url}
          alt="banner"
          className={styles.postBanner}
        />
        <article className={styles.postContent}>
          <h1>{post.data.title}</h1>

          <div className={styles.postContentInfo}>
            <div>
              <FiCalendar />
              <time>
                {format(new Date(post.first_publication_date), `dd MMM yyyy`, {
                  locale: ptBR,
                })}
              </time>
            </div>
            <div>
              <FiUser />
              <span>{post.data.author}</span>
            </div>
            <div>
              <FiClock />
              <span>{`${readTime} min`}</span>
            </div>
          </div>

          <div className={styles.postUpdate}>
            {post.last_publication_date && (
              <time>
                {format(
                  new Date(post.last_publication_date),
                  "'* editado em' dd MMM yyyy', às' H':'m",
                  {
                    locale: ptBR,
                  }
                )}
              </time>
            )}
          </div>

          <div>
            {post?.data?.content?.map(content => (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  className={styles.postSection}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            ))}
          </div>

          <section className={styles.navigation}>
            {navigation?.prevPost.length > 0 && (
              <div>
                <h3>{navigation.prevPost[0].data.title}</h3>
                <Link href={`/post/${navigation.prevPost[0].uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            )}

            {navigation?.nextPost.length > 0 && (
              <div>
                <h3>{navigation.nextPost[0].data.title}</h3>
                <Link href={`/post/${navigation.nextPost[0].uid}`}>
                  <a>Próximo Post</a>
                </Link>
              </div>
            )}
          </section>

          <Comments />

          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a className={commomStyles.preview}>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author', 'posts.content'],
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
  };
};
