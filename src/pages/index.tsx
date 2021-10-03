import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';

import { useState } from 'react';

import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import styles from './home.module.scss';
import commomStyles from '../styles/common.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleNextPage(): Promise<void> {
    const postsResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );

    if (postsResults) {
      setNextPage(postsResults.nextPage);
      setCurrentPage(postsResults.page);

      const newPosts = postsResults.results.map(post => ({
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }));

      setPosts([...posts, ...newPosts]);
    }
  }

  return (
    <>
      <Head>
        <title>Home | Ignite Blog</title>
      </Head>

      <main className={styles.homeContainer}>
        <Header />
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfoFooter}>
                  <div>
                    <FiCalendar />
                    <time>{post.first_publication_date}</time>
                  </div>
                  <div>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button
              type="button"
              onClick={handleNextPage}
              className={styles.loadButton}
            >
              Carregar mais posts
            </button>
          )}

          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a className={commomStyles.preview}>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { pageSize: 1 }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
      preview,
    },
  };
};
